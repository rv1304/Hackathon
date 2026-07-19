package com.procureintel.delivery;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecommendationRepository extends JpaRepository<RecommendationEntity, String> {
    List<RecommendationEntity> findAllByOrderByCreatedAtDesc();
    List<RecommendationEntity> findByStatusOrderByCreatedAtDesc(String status);
}
