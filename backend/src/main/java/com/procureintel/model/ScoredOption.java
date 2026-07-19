package com.procureintel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoredOption {
    private ProcurementOption option;
    private FeatureVector features;
    private double topsisScore;
    private boolean paretoOptimal;
    private int rank;
}
