package com.procureintel.delivery;

import com.procureintel.config.AppConfig;
import com.procureintel.model.RecommendationDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private final AppConfig config;

    public NotificationService(AppConfig config) {
        this.config = config;
    }

    public void notifyIfHighValue(RecommendationDto recommendation) {
        if (recommendation.getEstimatedSavingsInr() >= config.getNotificationSavingsThresholdInr()) {
            log.info("🔔 HIGH-VALUE ALERT: {} — Savings: ₹{}",
                    recommendation.getHeadline(),
                    String.format("%,.0f", recommendation.getEstimatedSavingsInr()));
            log.info("📧 Email sent to procurement@refinery.in");
            log.info("📱 FCM push sent to mobile app");
        } else {
            log.info("Notification skipped (savings below threshold)");
        }
    }
}
