package com.procureintel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphNode {
    private String id;
    private String label;
    private String type;
    private Object value;
    private List<String> dependsOn;
    private String formula;
    private Instant updatedAt;
}
