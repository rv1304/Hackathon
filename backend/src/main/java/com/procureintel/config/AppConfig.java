package com.procureintel.config;

import com.procureintel.model.CriteriaWeights;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "procureintel")
public class AppConfig {
    private double fxRate = 83.45;
    private double baselineLandedCostInr = 6850.0;
    private int inventoryBufferDays = 12;
    private int requiredDeliveryDays = 14;
    private CriteriaWeights criteriaWeights = CriteriaWeights.defaults();
    private double notificationSavingsThresholdInr = 500000;
}
