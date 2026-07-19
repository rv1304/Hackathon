package com.procureintel.recommendation;

import com.procureintel.model.*;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final NumberFormat inrFormat = NumberFormat.getCurrencyInstance(new Locale("en", "IN"));

    public RecommendationDto build(List<ScoredOption> ranked, OptimizedResult optimization,
                                   CriteriaWeights weights, MarketSignals signals) {
        ScoredOption top = optimization.getBaseOption() != null ? optimization.getBaseOption() : ranked.get(0);

        String headline = buildHeadline(top, optimization);
        String reasoning = buildReasoning(top, ranked, optimization, signals);
        String explanation = buildExplanation(top, ranked, optimization, weights, signals);

        Map<String, Double> weightsMap = Map.of(
                "price", weights.getPrice(),
                "eta", weights.getEta(),
                "weatherRisk", weights.getWeatherRisk(),
                "geoRisk", weights.getGeoRisk(),
                "relationship", weights.getRelationship(),
                "refineryYield", weights.getRefineryYield()
        );

        return RecommendationDto.builder()
                .id(UUID.randomUUID().toString())
                .headline(headline)
                .reasoning(reasoning)
                .explanation(explanation)
                .action(optimization.getAction())
                .estimatedSavingsInr(optimization.getEstimatedSavingsInr())
                .status("PENDING")
                .topOption(top)
                .allOptions(ranked)
                .weightsUsed(weightsMap)
                .optimization(optimization)
                .sapPayloadPreview(buildSapPayload(top, optimization))
                .createdAt(Instant.now())
                .build();
    }

    private String buildHeadline(ScoredOption top, OptimizedResult opt) {
        if (opt.getEstimatedSavingsInr() > 0 && "WAIT".equals(opt.getAction())) {
            return String.format("Delay %s purchase by %d days — save ~%s",
                    top.getOption().getCrudeGrade(), opt.getDelayDays(),
                    formatInr(opt.getEstimatedSavingsInr()));
        }
        if (opt.getEstimatedSavingsInr() > 0) {
            return String.format("Proceed with %s via %s — save ~%s",
                    top.getOption().getCrudeGrade(), top.getOption().getDestinationPort(),
                    formatInr(opt.getEstimatedSavingsInr()));
        }
        return String.format("Buy %s from %s via %s (TOPSIS score %.2f)",
                top.getOption().getCrudeGrade(), top.getOption().getSupplier(),
                top.getOption().getRoute(), top.getTopsisScore());
    }

    private String buildReasoning(ScoredOption top, List<ScoredOption> ranked,
                                  OptimizedResult opt, MarketSignals signals) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("TOPSIS ranked %s/%s highest (score %.2f). ",
                top.getOption().getCrudeGrade(), top.getOption().getSupplier(), top.getTopsisScore()));

        if (ranked.size() > 1) {
            ScoredOption second = ranked.get(1);
            if (second.getFeatures().getLandedCostInr() < top.getFeatures().getLandedCostInr()) {
                double pct = (top.getFeatures().getLandedCostInr() - second.getFeatures().getLandedCostInr())
                        / second.getFeatures().getLandedCostInr() * 100;
                sb.append(String.format("Option 2 is %.1f%% cheaper but higher geo-risk (%.2f vs %.2f). ",
                        pct, top.getFeatures().getGeoRisk(), second.getFeatures().getGeoRisk()));
            }
        }

        sb.append(String.format("Inventory buffer: %d days. Gulf events (7d): %d. ",
                12, signals.getGulfNegativeEvents7d()));

        if (!"none".equals(opt.getTrickApplied())) {
            sb.append(String.format("Optimizer applied %s.", opt.getTrickApplied().replace("_", " ")));
        }
        return sb.toString();
    }

    private String buildExplanation(ScoredOption top, List<ScoredOption> ranked,
                                    OptimizedResult opt, CriteriaWeights weights, MarketSignals signals) {
        long paretoCount = ranked.stream().filter(ScoredOption::isParetoOptimal).count();
        String dominated = ranked.stream()
                .filter(o -> !o.isParetoOptimal())
                .map(o -> o.getOption().getCrudeGrade())
                .limit(2)
                .collect(Collectors.joining(", "));

        return String.format(
                "%s (%s, %s contract) ranked #1 with TOPSIS score %.2f. " +
                "Landed cost ₹%.0f/bbl, ETA %d days, relationship score %.0f%%, geo-risk %.2f. " +
                "%d of %d options are Pareto-optimal.%s " +
                "Weights: price %.0f%%, ETA %.0f%%, risk %.0f%%. " +
                "USD/INR %.2f, monsoon factor %.2fx.",
                top.getOption().getCrudeGrade(),
                top.getOption().getSupplier(),
                top.getOption().getContractType(),
                top.getTopsisScore(),
                top.getFeatures().getLandedCostInr(),
                top.getFeatures().getEtaDays(),
                top.getFeatures().getRelationshipScore() * 100,
                top.getFeatures().getGeoRisk(),
                paretoCount, ranked.size(),
                dominated.isEmpty() ? "" : " Dominated options: " + dominated + ".",
                weights.getPrice() * 100, weights.getEta() * 100,
                (weights.getWeatherRisk() + weights.getGeoRisk()) * 100,
                signals.getFxRate(), signals.getMonsoonFactor()
        );
    }

    private String buildSapPayload(ScoredOption top, OptimizedResult opt) {
        return String.format("""
                {
                  "PurchaseOrderType": "NB",
                  "Supplier": "%s",
                  "Material": "%s",
                  "Plant": "%s",
                  "Quantity": 100000,
                  "Unit": "BBL",
                  "NetPriceAmount": %.2f,
                  "Currency": "USD",
                  "DeliveryDate": "+%d days",
                  "Incoterms": "CIF",
                  "Port": "%s",
                  "ContractType": "%s",
                  "RecommendationAction": "%s",
                  "EstimatedSavingsINR": %.0f
                }""",
                top.getOption().getSupplier(),
                top.getOption().getCrudeGrade(),
                top.getOption().getRefinery(),
                top.getFeatures().getRawPriceUsd(),
                top.getFeatures().getEtaDays() + opt.getDelayDays(),
                top.getOption().getDestinationPort(),
                top.getOption().getContractType().toUpperCase(),
                opt.getAction(),
                opt.getEstimatedSavingsInr());
    }

    private String formatInr(double amount) {
        return inrFormat.format(amount).replace("₹", "₹");
    }
}
