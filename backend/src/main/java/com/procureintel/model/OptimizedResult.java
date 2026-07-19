package com.procureintel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptimizedResult {
    private String action;
    private int delayDays;
    private double estimatedSavingsInr;
    private String trickApplied;
    private ScoredOption baseOption;
}
