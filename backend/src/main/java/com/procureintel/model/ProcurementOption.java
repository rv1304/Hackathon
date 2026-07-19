package com.procureintel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcurementOption {
    private String id;
    private String supplier;
    private String crudeGrade;
    private String route;
    private String destinationPort;
    private String timing;
    private String contractType;
    private String refinery;
    private double crudePriceUsd;
    private double freightUsd;
    private int waitDays;
}
