package com.procureintel.mcda;

import com.procureintel.model.CriteriaWeights;
import com.procureintel.model.FeatureVector;
import com.procureintel.model.ProcurementOption;
import com.procureintel.model.ScoredOption;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.IntStream;

@Service
public class TopsisRankerService {

    // benefit criteria (higher is better): price, eta, relationship, refinery
    // cost criteria (lower is better): weatherRisk, geoRisk — invert for TOPSIS
    private static final boolean[] IS_BENEFIT = {true, true, false, false, true, true};

    public List<ScoredOption> rank(List<ProcurementOption> options, List<FeatureVector> features,
                                   CriteriaWeights weights) {
        if (options.isEmpty()) return List.of();

        int n = options.size();
        int m = 6;
        double[][] matrix = new double[n][m];
        double[] w = weights.toArray();

        for (int i = 0; i < n; i++) {
            FeatureVector f = features.get(i);
            matrix[i] = new double[]{
                    f.getPriceScore(), f.getEtaScore(), f.getWeatherRisk(),
                    f.getGeoRisk(), f.getRelationshipScore(), f.getRefineryYield()
            };
        }

        // Normalize (vector normalization)
        double[][] norm = new double[n][m];
        for (int j = 0; j < m; j++) {
            double sumSq = 0;
            for (int i = 0; i < n; i++) sumSq += matrix[i][j] * matrix[i][j];
            double denom = Math.sqrt(sumSq);
            for (int i = 0; i < n; i++) {
                norm[i][j] = denom > 0 ? matrix[i][j] / denom : 0;
            }
        }

        // Weight
        double[][] weighted = new double[n][m];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < m; j++) {
                weighted[i][j] = norm[i][j] * w[j];
            }
        }

        // Ideal and anti-ideal
        double[] ideal = new double[m];
        double[] antiIdeal = new double[m];
        for (int j = 0; j < m; j++) {
            final int col = j;
            double max = IntStream.range(0, n).mapToDouble(i -> weighted[i][col]).max().orElse(0);
            double min = IntStream.range(0, n).mapToDouble(i -> weighted[i][col]).min().orElse(0);
            if (IS_BENEFIT[j]) {
                ideal[j] = max;
                antiIdeal[j] = min;
            } else {
                ideal[j] = min;
                antiIdeal[j] = max;
            }
        }

        double[] scores = new double[n];
        for (int i = 0; i < n; i++) {
            double dIdeal = 0, dAnti = 0;
            for (int j = 0; j < m; j++) {
                dIdeal += Math.pow(weighted[i][j] - ideal[j], 2);
                dAnti += Math.pow(weighted[i][j] - antiIdeal[j], 2);
            }
            dIdeal = Math.sqrt(dIdeal);
            dAnti = Math.sqrt(dAnti);
            scores[i] = dAnti + dIdeal > 0 ? dAnti / (dIdeal + dAnti) : 0;
        }

        boolean[] pareto = computePareto(features);

        List<ScoredOption> result = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            result.add(ScoredOption.builder()
                    .option(options.get(i))
                    .features(features.get(i))
                    .topsisScore(scores[i])
                    .paretoOptimal(pareto[i])
                    .build());
        }

        result.sort(Comparator.comparingDouble(ScoredOption::getTopsisScore).reversed());
        for (int i = 0; i < result.size(); i++) {
            result.get(i).setRank(i + 1);
        }
        return result;
    }

    private boolean[] computePareto(List<FeatureVector> features) {
        int n = features.size();
        boolean[] pareto = new boolean[n];
        for (int i = 0; i < n; i++) {
            pareto[i] = true;
            for (int j = 0; j < n; j++) {
                if (i == j) continue;
                if (dominates(features.get(j), features.get(i))) {
                    pareto[i] = false;
                    break;
                }
            }
        }
        return pareto;
    }

    private boolean dominates(FeatureVector a, FeatureVector b) {
        // a dominates b if a is >= on all benefit criteria and <= on cost, with strict improvement on at least one
        boolean strict = false;
        if (a.getPriceScore() < b.getPriceScore()) return false;
        if (a.getPriceScore() > b.getPriceScore()) strict = true;
        if (a.getEtaScore() < b.getEtaScore()) return false;
        if (a.getEtaScore() > b.getEtaScore()) strict = true;
        if (a.getWeatherRisk() > b.getWeatherRisk()) return false;
        if (a.getWeatherRisk() < b.getWeatherRisk()) strict = true;
        if (a.getGeoRisk() > b.getGeoRisk()) return false;
        if (a.getGeoRisk() < b.getGeoRisk()) strict = true;
        return strict;
    }
}
