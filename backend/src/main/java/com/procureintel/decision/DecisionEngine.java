package com.procureintel.decision;

import com.procureintel.config.AppConfig;
import com.procureintel.model.FeatureVector;
import com.procureintel.model.MarketSignals;
import com.procureintel.model.ProcurementOption;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Hard business-rule gate between feature scoring and MCDA ranking.
 * Deterministic — no LLM. Rejects options that violate procurement policy.
 */
@Service
public class DecisionEngine {

    private final AppConfig config;

    public DecisionEngine(AppConfig config) {
        this.config = config;
    }

    public record EligibilityResult(ProcurementOption option, FeatureVector features,
                                    boolean eligible, List<String> rejectionReasons) {}

    public List<EligibilityResult> evaluate(List<ProcurementOption> options,
                                            List<FeatureVector> features,
                                            MarketSignals signals) {
        List<EligibilityResult> results = new ArrayList<>();
        for (int i = 0; i < options.size(); i++) {
            ProcurementOption opt = options.get(i);
            FeatureVector fv = features.get(i);
            List<String> reasons = new ArrayList<>();

            if (fv.getEtaDays() > config.getRequiredDeliveryDays()) {
                reasons.add("ETA exceeds required delivery window");
            }
            if (fv.getGeoRisk() > 0.65) {
                reasons.add("Geopolitical risk above policy threshold (0.65)");
            }
            if (fv.getWeatherRisk() > 0.75 && signals.getMonsoonFactor() > 1.1) {
                reasons.add("Monsoon weather risk too high for west-coast route");
            }
            if (config.getInventoryBufferDays() < 5 && fv.getEtaDays() > 10) {
                reasons.add("Critical inventory — slow option rejected");
            }
            if ("spot".equals(opt.getContractType()) && signals.getPriceVolatility30d() > 0.12) {
                reasons.add("Spot purchase blocked during high volatility");
            }

            results.add(new EligibilityResult(opt, fv, reasons.isEmpty(), reasons));
        }
        return results;
    }

    public List<ProcurementOption> eligibleOptions(List<EligibilityResult> results) {
        return results.stream().filter(EligibilityResult::eligible).map(EligibilityResult::option).toList();
    }

    public List<FeatureVector> eligibleFeatures(List<EligibilityResult> results) {
        return results.stream().filter(EligibilityResult::eligible).map(EligibilityResult::features).toList();
    }
}
