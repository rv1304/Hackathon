package com.procureintel.graph;

import com.procureintel.model.GraphDefinition;
import com.procureintel.model.GraphNode;
import com.procureintel.model.MarketSignals;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class GraphEngine {

    private final Map<String, GraphNode> nodes = new LinkedHashMap<>();
    private final Map<String, List<String>> reverseEdges = new HashMap<>();

    public GraphEngine() {
        initializeGraph();
    }

    private void initializeGraph() {
        List<GraphNode> defs = List.of(
                node("weather", "Weather", "raw_input", null, List.of()),
                node("ports_availability", "Ports Availability", "raw_input", null, List.of()),
                node("inventory", "Inventory", "raw_input", null, List.of()),
                node("raw_oil_price", "Raw Oil Price", "raw_input", null, List.of()),
                node("news_sentiment", "News / Sentiment", "raw_input", null, List.of()),
                node("refinery_capability", "Refinery Capability", "raw_input", null, List.of()),
                node("type_of_oil", "Type of Oil", "raw_input", null, List.of()),
                node("dataset", "Dataset", "raw_input", null, List.of()),
                node("route", "Route", "computed", null, List.of("ports_availability")),
                node("logistics", "Logistics", "computed", null, List.of("route", "weather")),
                node("demand", "Demand", "computed", null, List.of("weather", "inventory")),
                node("risk", "Risk", "computed", null, List.of("news_sentiment")),
                node("refinery", "Refinery", "computed", null, List.of("refinery_capability", "type_of_oil")),
                node("contracts", "Contracts", "computed", null, List.of("dataset")),
                node("final_price", "Final Price", "computed", null,
                        List.of("contracts", "logistics", "demand", "raw_oil_price", "risk", "refinery"))
        );

        for (GraphNode n : defs) {
            nodes.put(n.getId(), n);
            for (String dep : n.getDependsOn()) {
                reverseEdges.computeIfAbsent(dep, k -> new ArrayList<>()).add(n.getId());
            }
        }
    }

    private GraphNode node(String id, String label, String type, Object value, List<String> deps) {
        return GraphNode.builder()
                .id(id).label(label).type(type).value(value).dependsOn(deps)
                .updatedAt(Instant.now()).build();
    }

    public double recompute(MarketSignals signals) {
        setRaw("weather", 1.0 - signals.getWeatherSeverity());
        setRaw("ports_availability", 1.0 - signals.getPortCongestion());
        setRaw("inventory", (double) signals.getUpdatedAt().getEpochSecond() % 100 / 100.0 + 0.5);
        setRaw("raw_oil_price", signals.getRawOilPriceUsd());
        setRaw("news_sentiment", Math.max(0, 1.0 - signals.getGulfNegativeEvents7d() / 50.0));
        setRaw("refinery_capability", 0.92);
        setRaw("type_of_oil", 0.85);
        setRaw("dataset", 0.88);

        compute("route", n -> avg(n, "ports_availability") * 100);
        compute("logistics", n -> (avg(n, "route") + avg(n, "weather") * 50) * signals.getMonsoonFactor());
        compute("demand", n -> (avg(n, "weather") + avg(n, "inventory")) * 45);
        compute("risk", n -> avg(n, "news_sentiment") * 80 + signals.getPriceVolatility30d() * 20);
        compute("refinery", n -> (avg(n, "refinery_capability") + avg(n, "type_of_oil")) / 2 * 90);
        compute("contracts", n -> avg(n, "dataset") * 75);
        compute("final_price", n ->
                0.25 * num("raw_oil_price") +
                0.15 * num("logistics") / 100 +
                0.15 * num("demand") / 100 +
                0.15 * num("contracts") / 100 +
                0.15 * num("risk") / 100 +
                0.15 * num("refinery") / 100
        );

        return num("final_price");
    }

    private void setRaw(String id, double value) {
        GraphNode n = nodes.get(id);
        n.setValue(value);
        n.setUpdatedAt(Instant.now());
    }

    private void compute(String id, Function<Map<String, GraphNode>, Double> fn) {
        GraphNode n = nodes.get(id);
        n.setValue(fn.apply(nodes));
        n.setUpdatedAt(Instant.now());
    }

    private double avg(Map<String, GraphNode> all, String depId) {
        return ((Number) all.get(depId).getValue()).doubleValue();
    }

    private double num(String id) {
        return ((Number) nodes.get(id).getValue()).doubleValue();
    }

    public GraphDefinition getDefinition() {
        List<Map<String, String>> edges = new ArrayList<>();
        for (GraphNode n : nodes.values()) {
            for (String dep : n.getDependsOn()) {
                edges.add(Map.of("from", dep, "to", n.getId()));
            }
        }
        return GraphDefinition.builder()
                .nodes(new ArrayList<>(nodes.values()))
                .edges(edges)
                .build();
    }

    public List<GraphNode> getNodes() {
        return new ArrayList<>(nodes.values());
    }

    public double getValue(String id) {
        return num(id);
    }
}
