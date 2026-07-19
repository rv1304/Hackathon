package com.procureintel.scoring;

import com.procureintel.config.AppConfig;
import com.procureintel.model.FeatureVector;
import com.procureintel.model.MarketSignals;
import com.procureintel.model.ProcurementOption;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class FeatureScorerService {

    private static final Map<String, Double> RELATIONSHIP = Map.of(
            "UAE", 0.96, "SAUDI", 0.94, "IRAQ", 0.78, "KUWAIT", 0.91,
            "NIGERIA", 0.72, "USA", 0.85
    );

    private static final Map<String, Double> REFINERY_YIELD = Map.of(
            "JAMNAGAR", 0.94, "MUMBAI", 0.88, "VADINAR", 0.90
    );

    private static final Map<String, Double> GRADE_YIELD = Map.of(
            "Murban", 0.95, "Arab Light", 0.93, "Basra Light", 0.87,
            "Bonny Light", 0.89, "WTI", 0.91, "Kuwait Export", 0.92
    );

    private static final double CUSTOMS_DUTY = 0.025;
    private static final double PORT_CHARGES = 120.0;

    private final AppConfig config;

    public FeatureScorerService(AppConfig config) {
        this.config = config;
    }

    public FeatureVector score(ProcurementOption option, MarketSignals signals, double finalPriceBenchmark) {
        double landedInr = computeLandedCostInr(option, signals);
        double advantage = 1.0 - (landedInr / config.getBaselineLandedCostInr());
        double priceScore = clamp(advantage, 0, 1);

        int etaDays = computeEtaDays(option, signals);
        double etaScore = clamp(1.0 - (etaDays / 25.0), 0, 1);

        double weatherRisk = computeWeatherRisk(option, signals);
        double geoRisk = computeGeoRisk(option, signals);
        double relationship = RELATIONSHIP.getOrDefault(option.getSupplier(), 0.7);
        if ("term".equals(option.getContractType())) relationship = Math.min(1.0, relationship + 0.05);

        double refineryYield = REFINERY_YIELD.getOrDefault(option.getRefinery(), 0.85)
                * GRADE_YIELD.getOrDefault(option.getCrudeGrade(), 0.85);

        return FeatureVector.builder()
                .optionId(option.getId())
                .priceScore(priceScore)
                .etaScore(etaScore)
                .weatherRisk(weatherRisk)
                .geoRisk(geoRisk)
                .relationshipScore(relationship)
                .refineryYield(refineryYield)
                .landedCostInr(landedInr)
                .etaDays(etaDays)
                .rawPriceUsd(option.getCrudePriceUsd())
                .build();
    }

    private double computeLandedCostInr(ProcurementOption option, MarketSignals signals) {
        double usdPerBbl = option.getCrudePriceUsd() + option.getFreightUsd();
        double inr = usdPerBbl * signals.getFxRate();
        inr *= (1 + CUSTOMS_DUTY);
        inr += PORT_CHARGES;
        if ("spot".equals(option.getContractType())) inr *= 1.02;
        return inr;
    }

    private int computeEtaDays(ProcurementOption option, MarketSignals signals) {
        int base;
        if (option.getRoute().contains("Cape")) base = 18;
        else if (option.getRoute().contains("West Africa")) base = 14;
        else base = 6;

        double weatherMult = 1.0 + signals.getWeatherSeverity() * 0.4;
        double congestionMult = 1.0 + signals.getPortCongestion() * 0.3;
        return (int) Math.ceil(base * signals.getMonsoonFactor() * weatherMult * congestionMult) + option.getWaitDays();
    }

    private double computeWeatherRisk(ProcurementOption option, MarketSignals signals) {
        double routeExposure = option.getRoute().contains("Mumbai") ? 0.8 : 0.5;
        if (option.getDestinationPort().equals("MUMDRA")) routeExposure = 0.6;
        return clamp(signals.getWeatherSeverity() * routeExposure * signals.getMonsoonFactor() / 1.2, 0, 1);
    }

    private double computeGeoRisk(ProcurementOption option, MarketSignals signals) {
        double sanctions = 0;
        double gulfExposure = option.getRoute().contains("Hormuz") ? 1.0 : 0.3;
        double newsRisk = clamp(signals.getGulfNegativeEvents7d() / 40.0, 0, 1) * gulfExposure;
        double volatility = clamp(signals.getPriceVolatility30d() * 3, 0, 1);
        double supplierRisk = switch (option.getSupplier()) {
            case "IRAQ" -> 0.35;
            case "NIGERIA" -> 0.28;
            default -> 0.12;
        };
        return clamp(0.3 * sanctions + 0.35 * newsRisk + 0.2 * volatility + 0.15 * supplierRisk, 0, 1);
    }

    private double clamp(double v, double min, double max) {
        return Math.max(min, Math.min(max, v));
    }
}
