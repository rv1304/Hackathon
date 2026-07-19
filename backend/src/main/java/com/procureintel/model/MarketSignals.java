package com.procureintel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class MarketSignals {
    private double rawOilPriceUsd;
    private double fxRate;
    private double weatherSeverity;
    private double portCongestion;
    private int gulfNegativeEvents7d;
    private double priceVolatility30d;
    private double monsoonFactor;
    private Instant updatedAt;
}
