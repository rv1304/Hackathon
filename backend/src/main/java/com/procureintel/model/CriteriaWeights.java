package com.procureintel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CriteriaWeights {
    private double price;
    private double eta;
    private double weatherRisk;
    private double geoRisk;
    private double relationship;
    private double refineryYield;

    public static CriteriaWeights defaults() {
        return CriteriaWeights.builder()
                .price(0.30)
                .eta(0.20)
                .weatherRisk(0.15)
                .geoRisk(0.15)
                .relationship(0.10)
                .refineryYield(0.10)
                .build();
    }

    public double[] toArray() {
        return new double[]{price, eta, weatherRisk, geoRisk, relationship, refineryYield};
    }
}
