package com.procureintel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationDto {
    private String id;
    private String headline;
    private String reasoning;
    private String explanation;
    private String action;
    private double estimatedSavingsInr;
    private String status;
    private ScoredOption topOption;
    private List<ScoredOption> allOptions;
    private Map<String, Double> weightsUsed;
    private OptimizedResult optimization;
    private String sapPayloadPreview;
    private Instant createdAt;
}
