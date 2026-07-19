package com.procureintel.optimizer;

import com.procureintel.config.AppConfig;
import com.procureintel.model.MarketSignals;
import com.procureintel.model.OptimizedResult;
import com.procureintel.model.ScoredOption;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class OptimizerService {

    private final AppConfig config;

    public OptimizerService(AppConfig config) {
        this.config = config;
    }

    public OptimizedResult optimize(ScoredOption best, List<ScoredOption> all, MarketSignals signals) {
        List<OptimizedResult> tricks = List.of(
                timingArbitrage(best, signals),
                spotVsTerm(best, all, signals),
                fxTiming(best, signals),
                demurrageAvoidance(best, all, signals)
        ).stream().flatMap(Optional::stream).toList();

        return tricks.stream()
                .max(Comparator.comparingDouble(OptimizedResult::getEstimatedSavingsInr))
                .orElse(OptimizedResult.builder()
                        .action("BUY_NOW")
                        .delayDays(0)
                        .estimatedSavingsInr(0)
                        .trickApplied("none")
                        .baseOption(best)
                        .build());
    }

    private Optional<OptimizedResult> timingArbitrage(ScoredOption best, MarketSignals signals) {
        int buffer = config.getInventoryBufferDays();
        if (buffer < 7) return Optional.empty();

        double dipProbability = signals.getPriceVolatility30d() * (1 - best.getFeatures().getGeoRisk());
        if (dipProbability < 0.06) return Optional.empty();

        int delayDays = Math.min(4, buffer - 5);
        double dailyVolume = 100000; // barrels placeholder
        double savingsPerBbl = best.getFeatures().getRawPriceUsd() * dipProbability * 0.15;
        double savingsInr = savingsPerBbl * dailyVolume * signals.getFxRate() / 1000;

        return Optional.of(OptimizedResult.builder()
                .action("WAIT")
                .delayDays(delayDays)
                .estimatedSavingsInr(savingsInr)
                .trickApplied("timing_arbitrage")
                .baseOption(best)
                .build());
    }

    private Optional<OptimizedResult> spotVsTerm(ScoredOption best, List<ScoredOption> all, MarketSignals signals) {
        if (!"term".equals(best.getOption().getContractType())) return Optional.empty();

        Optional<ScoredOption> spotAlt = all.stream()
                .filter(o -> o.getOption().getSupplier().equals(best.getOption().getSupplier()))
                .filter(o -> "spot".equals(o.getOption().getContractType()))
                .filter(o -> o.getFeatures().getLandedCostInr() < best.getFeatures().getLandedCostInr())
                .findFirst();

        if (spotAlt.isEmpty()) return Optional.empty();

        double savings = best.getFeatures().getLandedCostInr() - spotAlt.get().getFeatures().getLandedCostInr();
        if (savings < 50000) return Optional.empty();

        return Optional.of(OptimizedResult.builder()
                .action("SWITCH_TO_SPOT")
                .delayDays(0)
                .estimatedSavingsInr(savings * 100) // scaled for cargo
                .trickApplied("spot_vs_term")
                .baseOption(spotAlt.get())
                .build());
    }

    private Optional<OptimizedResult> fxTiming(ScoredOption best, MarketSignals signals) {
        if (signals.getFxRate() > config.getFxRate() * 1.01) return Optional.empty();

        double savings = best.getFeatures().getLandedCostInr() * 0.008 * 100;
        return Optional.of(OptimizedResult.builder()
                .action("HEDGE_FX")
                .delayDays(2)
                .estimatedSavingsInr(savings)
                .trickApplied("fx_timing")
                .baseOption(best)
                .build());
    }

    private Optional<OptimizedResult> demurrageAvoidance(ScoredOption best, List<ScoredOption> all, MarketSignals signals) {
        if (signals.getPortCongestion() < 0.35) return Optional.empty();

        Optional<ScoredOption> altPort = all.stream()
                .filter(o -> !o.getOption().getDestinationPort().equals(best.getOption().getDestinationPort()))
                .filter(o -> o.getFeatures().getGeoRisk() <= best.getFeatures().getGeoRisk() + 0.1)
                .min(Comparator.comparingDouble(o -> o.getFeatures().getLandedCostInr()));

        if (altPort.isEmpty()) return Optional.empty();

        double demurrageSaved = signals.getPortCongestion() * 350000;
        return Optional.of(OptimizedResult.builder()
                .action("SWITCH_PORT")
                .delayDays(0)
                .estimatedSavingsInr(demurrageSaved)
                .trickApplied("demurrage_avoidance")
                .baseOption(altPort.get())
                .build());
    }
}
