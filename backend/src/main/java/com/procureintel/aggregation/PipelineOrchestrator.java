package com.procureintel.aggregation;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.procureintel.config.AppConfig;
import com.procureintel.delivery.NotificationService;
import com.procureintel.delivery.RecommendationEntity;
import com.procureintel.delivery.RecommendationRepository;
import com.procureintel.decision.DecisionEngine;
import com.procureintel.graph.GraphEngine;
import com.procureintel.mcda.TopsisRankerService;
import com.procureintel.model.*;
import com.procureintel.optimizer.OptimizerService;
import com.procureintel.options.OptionGeneratorService;
import com.procureintel.recommendation.RecommendationService;
import com.procureintel.scoring.FeatureScorerService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class PipelineOrchestrator {

    private final GraphEngine graphEngine;
    private final MarketDataService marketDataService;
    private final OptionGeneratorService optionGenerator;
    private final FeatureScorerService featureScorer;
    private final DecisionEngine decisionEngine;
    private final TopsisRankerService topsisRanker;
    private final OptimizerService optimizer;
    private final RecommendationService recommendationService;
    private final RecommendationRepository recommendationRepository;
    private final NotificationService notificationService;
    private final AppConfig config;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    private final AtomicReference<PipelineResult> latest = new AtomicReference<>();
    private CriteriaWeights activeWeights;

    public PipelineOrchestrator(GraphEngine graphEngine, MarketDataService marketDataService,
                                OptionGeneratorService optionGenerator, FeatureScorerService featureScorer,
                                DecisionEngine decisionEngine, TopsisRankerService topsisRanker,
                                OptimizerService optimizer,
                                RecommendationService recommendationService,
                                RecommendationRepository recommendationRepository,
                                NotificationService notificationService, AppConfig config,
                                SimpMessagingTemplate messagingTemplate, ObjectMapper objectMapper) {
        this.graphEngine = graphEngine;
        this.marketDataService = marketDataService;
        this.optionGenerator = optionGenerator;
        this.featureScorer = featureScorer;
        this.decisionEngine = decisionEngine;
        this.topsisRanker = topsisRanker;
        this.optimizer = optimizer;
        this.recommendationService = recommendationService;
        this.recommendationRepository = recommendationRepository;
        this.notificationService = notificationService;
        this.config = config;
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
        this.activeWeights = config.getCriteriaWeights();
    }

    public PipelineResult runPipeline() {
        return runPipeline(marketDataService.refreshSignals());
    }

    public PipelineResult runPipeline(MarketSignals signals) {
        double finalPrice = graphEngine.recompute(signals);

        List<ProcurementOption> options = optionGenerator.generate(signals);
        List<FeatureVector> features = options.stream()
                .map(o -> featureScorer.score(o, signals, finalPrice))
                .toList();

        List<DecisionEngine.EligibilityResult> eligibility = decisionEngine.evaluate(options, features, signals);
        List<EligibilityAudit> audit = eligibility.stream()
                .map(e -> EligibilityAudit.builder()
                        .optionId(e.option().getId())
                        .crudeGrade(e.option().getCrudeGrade())
                        .supplier(e.option().getSupplier())
                        .eligible(e.eligible())
                        .rejectionReasons(e.rejectionReasons())
                        .build())
                .toList();

        List<ProcurementOption> eligibleOptions = decisionEngine.eligibleOptions(eligibility);
        List<FeatureVector> eligibleFeatures = decisionEngine.eligibleFeatures(eligibility);

        List<ScoredOption> ranked = topsisRanker.rank(eligibleOptions, eligibleFeatures, activeWeights);
        OptimizedResult optimization = ranked.isEmpty()
                ? OptimizedResult.builder().action("NO_OPTIONS").estimatedSavingsInr(0).build()
                : optimizer.optimize(ranked.get(0), ranked, signals);

        RecommendationDto recommendation = ranked.isEmpty()
                ? null
                : recommendationService.build(ranked, optimization, activeWeights, signals);

        if (recommendation != null) {
            persistRecommendation(recommendation);
            notificationService.notifyIfHighValue(recommendation);
        }

        PipelineResult result = PipelineResult.builder()
                .finalPrice(finalPrice)
                .graphNodes(graphEngine.getNodes())
                .rankedOptions(ranked)
                .eligibilityAudit(audit)
                .totalCandidates(options.size())
                .eligibleCount(eligibleOptions.size())
                .recommendation(recommendation)
                .signals(signals)
                .computedAt(Instant.now())
                .build();

        latest.set(result);
        messagingTemplate.convertAndSend("/topic/pipeline", result);
        if (recommendation != null) {
            messagingTemplate.convertAndSend("/topic/recommendations", recommendation);
        }
        return result;
    }

    public PipelineResult trigger(String triggerType, double magnitude) {
        MarketSignals signals = marketDataService.applyTrigger(triggerType, magnitude);
        return runPipeline(signals);
    }

    public PipelineResult getLatest() {
        PipelineResult current = latest.get();
        if (current == null) {
            return runPipeline();
        }
        return current;
    }

    public void updateWeights(CriteriaWeights weights) {
        this.activeWeights = weights;
        runPipeline(marketDataService.getCurrentSignals());
    }

    public CriteriaWeights getActiveWeights() {
        return activeWeights;
    }

    private void persistRecommendation(RecommendationDto dto) {
        RecommendationEntity entity = new RecommendationEntity();
        entity.setId(dto.getId());
        entity.setHeadline(dto.getHeadline());
        entity.setReasoning(dto.getReasoning());
        entity.setExplanation(dto.getExplanation());
        entity.setAction(dto.getAction());
        entity.setEstimatedSavingsInr(dto.getEstimatedSavingsInr());
        entity.setStatus(dto.getStatus());
        entity.setSapPayloadPreview(dto.getSapPayloadPreview());
        entity.setCreatedAt(dto.getCreatedAt());
        entity.setUpdatedAt(Instant.now());
        try {
            entity.setPayloadJson(objectMapper.writeValueAsString(dto));
        } catch (JsonProcessingException e) {
            entity.setPayloadJson("{}");
        }
        recommendationRepository.save(entity);
    }
}
