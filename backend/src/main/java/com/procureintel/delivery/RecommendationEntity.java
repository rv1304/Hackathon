package com.procureintel.delivery;

import com.procureintel.model.RecommendationDto;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;

@Entity
@Table(name = "recommendations")
@Data
public class RecommendationEntity {
    @Id
    private String id;
    private String headline;
    @Column(length = 2000)
    private String reasoning;
    @Column(length = 4000)
    private String explanation;
    private String action;
    private double estimatedSavingsInr;
    private String status;
    @Column(length = 8000)
    private String payloadJson;
    @Column(length = 4000)
    private String sapPayloadPreview;
    private Instant createdAt;
    private Instant updatedAt;
}
