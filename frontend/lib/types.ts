export interface GraphNode {
  id: string;
  label: string;
  type: string;
  value: number;
  dependsOn: string[];
  updatedAt: string;
}

export interface GraphDefinition {
  nodes: GraphNode[];
  edges: { from: string; to: string }[];
}

export interface ProcurementOption {
  id: string;
  supplier: string;
  crudeGrade: string;
  route: string;
  destinationPort: string;
  timing: string;
  contractType: string;
  refinery: string;
  crudePriceUsd: number;
  freightUsd: number;
  waitDays: number;
}

export interface FeatureVector {
  optionId: string;
  priceScore: number;
  etaScore: number;
  weatherRisk: number;
  geoRisk: number;
  relationshipScore: number;
  refineryYield: number;
  landedCostInr: number;
  etaDays: number;
  rawPriceUsd: number;
}

export interface ScoredOption {
  option: ProcurementOption;
  features: FeatureVector;
  topsisScore: number;
  paretoOptimal: boolean;
  rank: number;
}

export interface OptimizedResult {
  action: string;
  delayDays: number;
  estimatedSavingsInr: number;
  trickApplied: string;
  baseOption: ScoredOption | null;
}

export interface RecommendationDto {
  id: string;
  headline: string;
  reasoning: string;
  explanation: string;
  action: string;
  estimatedSavingsInr: number;
  status: string;
  topOption: ScoredOption;
  allOptions: ScoredOption[];
  weightsUsed: Record<string, number>;
  optimization: OptimizedResult;
  sapPayloadPreview: string;
  createdAt: string;
}

export interface MarketSignals {
  rawOilPriceUsd: number;
  fxRate: number;
  weatherSeverity: number;
  portCongestion: number;
  gulfNegativeEvents7d: number;
  priceVolatility30d: number;
  monsoonFactor: number;
  updatedAt: string;
}

export interface EligibilityAudit {
  optionId: string;
  crudeGrade: string;
  supplier: string;
  eligible: boolean;
  rejectionReasons: string[];
}

export interface PipelineResult {
  finalPrice: number;
  graphNodes: GraphNode[];
  rankedOptions: ScoredOption[];
  eligibilityAudit: EligibilityAudit[];
  totalCandidates: number;
  eligibleCount: number;
  recommendation: RecommendationDto | null;
  signals: MarketSignals;
  computedAt: string;
}

export interface CriteriaWeights {
  price: number;
  eta: number;
  weatherRisk: number;
  geoRisk: number;
  relationship: number;
  refineryYield: number;
}

export interface RecommendationEntity {
  id: string;
  headline: string;
  reasoning: string;
  explanation: string;
  action: string;
  estimatedSavingsInr: number;
  status: string;
  sapPayloadPreview: string;
  createdAt: string;
  updatedAt: string;
}

export interface SapResult {
  success: boolean;
  sapDocumentId: string;
  message: string;
  payloadSent: string;
}
