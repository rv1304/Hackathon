package com.procureintel.api;

import com.procureintel.aggregation.PipelineOrchestrator;
import com.procureintel.delivery.RecommendationEntity;
import com.procureintel.delivery.RecommendationRepository;
import com.procureintel.delivery.SapIntegrationService;
import com.procureintel.graph.GraphEngine;
import com.procureintel.model.CriteriaWeights;
import com.procureintel.model.PipelineResult;
import com.procureintel.model.RecommendationDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PipelineController {

    private final PipelineOrchestrator pipeline;
    private final GraphEngine graphEngine;
    private final RecommendationRepository recommendationRepository;
    private final SapIntegrationService sapService;

    public PipelineController(PipelineOrchestrator pipeline, GraphEngine graphEngine,
                              RecommendationRepository recommendationRepository,
                              SapIntegrationService sapService) {
        this.pipeline = pipeline;
        this.graphEngine = graphEngine;
        this.recommendationRepository = recommendationRepository;
        this.sapService = sapService;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "ProcureIntel India");
    }

    @GetMapping("/graph")
    public Object getGraph() {
        return graphEngine.getDefinition();
    }

    @GetMapping("/pipeline/latest")
    public PipelineResult getLatest() {
        return pipeline.getLatest();
    }

    @PostMapping("/pipeline/run")
    public PipelineResult runPipeline() {
        return pipeline.runPipeline();
    }

    @PostMapping("/pipeline/trigger")
    public PipelineResult trigger(@RequestBody TriggerRequest request) {
        return pipeline.trigger(request.triggerType(), request.magnitude());
    }

    @GetMapping("/weights")
    public CriteriaWeights getWeights() {
        return pipeline.getActiveWeights();
    }

    @PutMapping("/weights")
    public PipelineResult updateWeights(@RequestBody CriteriaWeights weights) {
        pipeline.updateWeights(weights);
        return pipeline.getLatest();
    }

    @GetMapping("/recommendations")
    public List<RecommendationEntity> listRecommendations() {
        return recommendationRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping("/recommendations/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable String id) {
        return recommendationRepository.findById(id)
                .map(entity -> {
                    entity.setStatus("APPROVED");
                    entity.setUpdatedAt(Instant.now());
                    recommendationRepository.save(entity);

                    RecommendationDto dto = RecommendationDto.builder()
                            .id(entity.getId())
                            .headline(entity.getHeadline())
                            .action(entity.getAction())
                            .estimatedSavingsInr(entity.getEstimatedSavingsInr())
                            .sapPayloadPreview(entity.getSapPayloadPreview())
                            .build();

                    var sapResult = sapService.pushPurchaseOrder(dto);
                    return ResponseEntity.ok(Map.of(
                            "status", "APPROVED",
                            "recommendationId", id,
                            "sap", sapResult
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/recommendations/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable String id) {
        return recommendationRepository.findById(id)
                .map(entity -> {
                    entity.setStatus("REJECTED");
                    entity.setUpdatedAt(Instant.now());
                    recommendationRepository.save(entity);
                    return ResponseEntity.ok(Map.of("status", "REJECTED", "recommendationId", id));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    public record TriggerRequest(String triggerType, double magnitude) {}
}
