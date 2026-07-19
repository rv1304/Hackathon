package com.procureintel.delivery;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.procureintel.model.RecommendationDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class SapIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(SapIntegrationService.class);

    public SapResponse pushPurchaseOrder(RecommendationDto recommendation) {
        log.info("=== SAP OData PO Create ===");
        log.info("Payload: {}", recommendation.getSapPayloadPreview());
        log.info("Headline: {}", recommendation.getHeadline());
        log.info("Action: {}", recommendation.getAction());

        // Mock SAP response — replace with real OData POST to S/4HANA
        return SapResponse.builder()
                .success(true)
                .sapDocumentId("PO-" + System.currentTimeMillis())
                .message("Purchase order created in SAP (mock). Awaiting goods receipt.")
                .payloadSent(recommendation.getSapPayloadPreview())
                .build();
    }

    public record SapResponse(boolean success, String sapDocumentId, String message, String payloadSent) {
        public static SapResponseBuilder builder() { return new SapResponseBuilder(); }
        public static class SapResponseBuilder {
            private boolean success;
            private String sapDocumentId;
            private String message;
            private String payloadSent;
            public SapResponseBuilder success(boolean s) { this.success = s; return this; }
            public SapResponseBuilder sapDocumentId(String id) { this.sapDocumentId = id; return this; }
            public SapResponseBuilder message(String m) { this.message = m; return this; }
            public SapResponseBuilder payloadSent(String p) { this.payloadSent = p; return this; }
            public SapResponse build() { return new SapResponse(success, sapDocumentId, message, payloadSent); }
        }
    }
}
