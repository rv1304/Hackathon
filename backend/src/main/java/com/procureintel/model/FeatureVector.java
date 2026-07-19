package com.procureintel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureVector {
    private String optionId;
    private double priceScore;
    private double etaScore;
    private double weatherRisk;
    private double geoRisk;
    private double relationshipScore;
    private double refineryYield;
    private double landedCostInr;
    private int etaDays;
    private double rawPriceUsd;
}
