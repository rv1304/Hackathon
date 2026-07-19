package com.procureintel.aggregation;

import com.procureintel.config.AppConfig;
import com.procureintel.model.MarketSignals;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class MarketDataService {

    private final AppConfig config;
    private final RestTemplate restTemplate = new RestTemplate();
    private final AtomicReference<MarketSignals> current;

    public MarketDataService(AppConfig config) {
        this.config = config;
        this.current = new AtomicReference<>(defaultSignals());
    }

    public MarketSignals getCurrentSignals() {
        return current.get();
    }

    public MarketSignals refreshSignals() {
        MarketSignals prev = current.get();
        double oilPrice = fetchOilPrice(prev.getRawOilPriceUsd());
        double fx = fetchFxRate(config.getFxRate());
        double weather = fetchWeatherSeverity(prev.getWeatherSeverity());
        double congestion = computePortCongestion(weather);
        MarketSignals updated = MarketSignals.builder()
                .rawOilPriceUsd(oilPrice)
                .fxRate(fx)
                .weatherSeverity(weather)
                .portCongestion(congestion)
                .gulfNegativeEvents7d(prev.getGulfNegativeEvents7d())
                .priceVolatility30d(0.08 + Math.random() * 0.04)
                .monsoonFactor(computeMonsoonFactor())
                .updatedAt(Instant.now())
                .build();
        current.set(updated);
        return updated;
    }

    public MarketSignals applyTrigger(String triggerType, double magnitude) {
        MarketSignals prev = current.get();
        MarketSignals.MarketSignalsBuilder b = prev.toBuilder().updatedAt(Instant.now());

        switch (triggerType.toLowerCase()) {
            case "weather" -> b.weatherSeverity(Math.min(1.0, Math.max(0, magnitude)));
            case "congestion" -> b.portCongestion(Math.min(1.0, Math.max(0, magnitude)));
            case "gulf_risk" -> b.gulfNegativeEvents7d((int) magnitude);
            case "oil_price" -> b.rawOilPriceUsd(magnitude);
            case "fx" -> b.fxRate(magnitude);
            default -> b.rawOilPriceUsd(prev.getRawOilPriceUsd() * (1 + (Math.random() - 0.5) * 0.02));
        }
        MarketSignals updated = b.build();
        current.set(updated);
        return updated;
    }

    private double fetchOilPrice(double fallback) {
        try {
            String csvData = restTemplate.getForObject(
                    "https://raw.githubusercontent.com/datasets/oil-prices/master/data/brent-daily.csv", String.class);
            if (csvData != null && !csvData.isEmpty()) {
                String[] lines = csvData.split("\\r?\\n");
                for (int i = lines.length - 1; i >= 0; i--) {
                    String line = lines[i].trim();
                    if (line.isEmpty() || line.startsWith("Date")) {
                        continue;
                    }
                    String[] parts = line.split(",");
                    if (parts.length >= 2) {
                        try {
                            return Double.parseDouble(parts[1].trim());
                        } catch (NumberFormatException ignored) {
                        }
                    }
                }
            }
        } catch (Exception e) {
            // fallback to previous value
        }
        return fallback > 0 ? fallback : 82.5;
    }

    private double fetchFxRate(double fallback) {
        try {
            var response = restTemplate.getForObject(
                    "https://api.exchangerate-api.com/v4/latest/USD", java.util.Map.class);
            if (response != null && response.get("rates") instanceof java.util.Map<?, ?> rates) {
                Object inr = rates.get("INR");
                if (inr instanceof Number n) return n.doubleValue();
            }
        } catch (Exception ignored) {
        }
        return fallback;
    }

    private double fetchWeatherSeverity(double fallback) {
        try {
            var response = restTemplate.getForObject(
                    "https://api.open-meteo.com/v1/forecast?latitude=18.96&longitude=72.86&current_weather=true", java.util.Map.class);
            if (response != null && response.get("current_weather") instanceof java.util.Map<?, ?> cw) {
                double windspeed = 0.0;
                int weathercode = 0;

                Object wsObj = cw.get("windspeed");
                if (wsObj instanceof Number n) {
                    windspeed = n.doubleValue();
                }
                Object wcObj = cw.get("weathercode");
                if (wcObj instanceof Number n) {
                    weathercode = n.intValue();
                }

                double windFactor = Math.min(1.0, Math.max(0.0, windspeed / 50.0));
                double codeFactor = switch (weathercode) {
                    case 0, 1, 2, 3 -> 0.05; // clear / partly cloudy
                    case 45, 48 -> 0.2;      // fog
                    case 51, 53, 55, 56, 57 -> 0.3; // drizzle
                    case 61, 63, 65, 66, 67 -> 0.5; // rain
                    case 71, 73, 75, 77 -> 0.4;     // snow
                    case 80, 81, 82 -> 0.6;          // rain showers
                    case 85, 86 -> 0.5;             // snow showers
                    case 95, 96, 99 -> 0.85;         // thunderstorm
                    default -> 0.15;
                };

                double severity = 0.7 * codeFactor + 0.3 * windFactor;
                return Math.min(1.0, Math.max(0.05, severity));
            }
        } catch (Exception e) {
            // fallback
        }
        return fallback;
    }

    private double computePortCongestion(double weatherSeverity) {
        // Port congestion is driven by weather severity with a slight random traffic baseline
        double baseCongestion = 0.10 + weatherSeverity * 0.4;
        double jitter = (Math.random() - 0.5) * 0.1;
        return Math.min(1.0, Math.max(0.05, baseCongestion + jitter));
    }

    private double computeMonsoonFactor() {
        int month = java.time.LocalDate.now().getMonthValue();
        if (month >= 6 && month <= 9) return 1.18; // monsoon west coast
        return 1.0;
    }

    private MarketSignals defaultSignals() {
        return MarketSignals.builder()
                .rawOilPriceUsd(82.5)
                .fxRate(config.getFxRate())
                .weatherSeverity(0.15)
                .portCongestion(0.22)
                .gulfNegativeEvents7d(12)
                .priceVolatility30d(0.09)
                .monsoonFactor(computeMonsoonFactor())
                .updatedAt(Instant.now())
                .build();
    }
}
