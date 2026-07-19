package com.procureintel.options;

import com.procureintel.config.AppConfig;
import com.procureintel.model.MarketSignals;
import com.procureintel.model.ProcurementOption;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class OptionGeneratorService {

    private static final Set<String> SANCTIONED = Set.of("RUSSIA");

    private final AppConfig config;

    public OptionGeneratorService(AppConfig config) {
        this.config = config;
    }

    public List<ProcurementOption> generate(MarketSignals signals) {
        List<SupplierSpec> suppliers = List.of(
                new SupplierSpec("SAUDI", "Arab Light", 81.5, 0.94, 2.8, false),
                new SupplierSpec("UAE", "Murban", 82.1, 0.96, 2.5, false),
                new SupplierSpec("IRAQ", "Basra Light", 79.5, 0.78, 3.2, false),
                new SupplierSpec("KUWAIT", "Kuwait Export", 81.8, 0.91, 2.6, false),
                new SupplierSpec("NIGERIA", "Bonny Light", 79.0, 0.72, 4.5, false),
                new SupplierSpec("USA", "WTI", 78.9, 0.85, 5.8, false),
                new SupplierSpec("RUSSIA", "Urals", 76.5, 0.65, 4.0, true)
        );

        List<RouteSpec> routes = List.of(
                new RouteSpec("HORMUZ_MUNDRA", "Hormuz → Arabian Sea → Mundra", "MUNDRA", 6, 0.18),
                new RouteSpec("HORMUZ_JAMNAGAR", "Hormuz → Jamnagar", "JAMNAGAR", 5, 0.15),
                new RouteSpec("CAPE_MUNDRA", "Cape of Good Hope → Mundra", "MUNDRA", 18, 0.08),
                new RouteSpec("WAF_MUMBAI", "West Africa → Mumbai", "MUMBAI", 14, 0.25)
        );

        List<TimingSpec> timings = List.of(
                new TimingSpec("buy_now", 0),
                new TimingSpec("wait_3d", 3),
                new TimingSpec("wait_7d", 7)
        );

        List<String> contractTypes = List.of("spot", "term");
        List<String> refineries = List.of("JAMNAGAR", "MUMBAI", "VADINAR");

        List<ProcurementOption> raw = new ArrayList<>();
        for (SupplierSpec s : suppliers) {
            for (RouteSpec r : routes) {
                for (TimingSpec t : timings) {
                    for (String ct : contractTypes) {
                        for (String ref : refineries) {
                            if (!isFeasible(s, r, t, signals)) continue;
                            double priceAdj = t.waitDays * 0.05 * signals.getPriceVolatility30d();
                            raw.add(ProcurementOption.builder()
                                    .id(String.format("%s_%s_%s_%s_%s", s.country, r.id, t.id, ct, ref))
                                    .supplier(s.country)
                                    .crudeGrade(s.grade)
                                    .route(r.name)
                                    .destinationPort(r.port)
                                    .timing(t.id)
                                    .contractType(ct)
                                    .refinery(ref)
                                    .crudePriceUsd(s.basePrice + priceAdj)
                                    .freightUsd(s.freightBase * r.freightMultiplier)
                                    .waitDays(t.waitDays)
                                    .build());
                        }
                    }
                }
            }
        }

        return selectDiverse(raw, signals);
    }

    private boolean isFeasible(SupplierSpec s, RouteSpec r, TimingSpec t, MarketSignals signals) {
        if (s.sanctioned || SANCTIONED.contains(s.country)) return false;
        int eta = (int) Math.ceil(r.baseDays * signals.getMonsoonFactor() * (1 + signals.getPortCongestion()));
        if (eta + t.waitDays > config.getRequiredDeliveryDays() + config.getInventoryBufferDays()) return false;
        if (signals.getGulfNegativeEvents7d() > 30 && r.id.startsWith("HORMUZ")) return false;
        if (signals.getWeatherSeverity() > 0.7 && r.id.contains("MUMBAI")) return false;
        return true;
    }

    private List<ProcurementOption> selectDiverse(List<ProcurementOption> feasible, MarketSignals signals) {
        if (feasible.isEmpty()) return List.of();

        // Preliminary price sort
        feasible.sort(Comparator.comparingDouble(o -> o.getCrudePriceUsd() + o.getFreightUsd()));

        Set<String> selected = new LinkedHashSet<>();
        List<ProcurementOption> result = new ArrayList<>();

        // Cheapest
        addIfNew(result, selected, feasible.get(0));

        // Fastest route (lowest wait + route days estimate)
        feasible.stream()
                .min(Comparator.comparingInt(o -> o.getWaitDays() + routeDaysEstimate(o)))
                .ifPresent(o -> addIfNew(result, selected, o));

        // Safest (non-Hormuz during high Gulf risk)
        feasible.stream()
                .filter(o -> !o.getRoute().startsWith("Hormuz") || signals.getGulfNegativeEvents7d() < 20)
                .findFirst()
                .ifPresent(o -> addIfNew(result, selected, o));

        // One per major supplier region
        for (String region : List.of("UAE", "SAUDI", "NIGERIA", "USA", "IRAQ")) {
            feasible.stream()
                    .filter(o -> o.getSupplier().equals(region))
                    .findFirst()
                    .ifPresent(o -> addIfNew(result, selected, o));
        }

        // Fill to 7 with diverse contract types
        for (ProcurementOption o : feasible) {
            if (result.size() >= 7) break;
            addIfNew(result, selected, o);
        }

        return result.stream().limit(7).collect(Collectors.toList());
    }

    private int routeDaysEstimate(ProcurementOption o) {
        if (o.getRoute().contains("Cape")) return 18;
        if (o.getRoute().contains("West Africa")) return 14;
        return 6;
    }

    private void addIfNew(List<ProcurementOption> result, Set<String> selected, ProcurementOption o) {
        if (selected.add(o.getId())) result.add(o);
    }

    private record SupplierSpec(String country, String grade, double basePrice, double reliability,
                                double freightBase, boolean sanctioned) {}
    private record RouteSpec(String id, String name, String port, int baseDays, double freightMultiplier) {}
    private record TimingSpec(String id, int waitDays) {}
}
