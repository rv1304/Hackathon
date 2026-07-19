package com.procureintel.config;

import com.procureintel.aggregation.PipelineOrchestrator;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class StartupRunner {

    private final PipelineOrchestrator pipeline;

    public StartupRunner(PipelineOrchestrator pipeline) {
        this.pipeline = pipeline;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        pipeline.runPipeline();
    }
}
