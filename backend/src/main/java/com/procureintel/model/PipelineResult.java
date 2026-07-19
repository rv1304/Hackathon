package com.procureintel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipelineResult {
    private double finalPrice;
    private List<GraphNode> graphNodes;
    private List<ScoredOption> rankedOptions;
    private List<EligibilityAudit> eligibilityAudit;
    private int totalCandidates;
    private int eligibleCount;
    private RecommendationDto recommendation;
    private MarketSignals signals;
    private Instant computedAt;
}
