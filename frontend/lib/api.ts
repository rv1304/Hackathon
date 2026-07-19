import type {
  CriteriaWeights,
  GraphDefinition,
  PipelineResult,
  RecommendationEntity,
  SapResult,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
}

export const api = {
  getGraph:     () => fetchJson<GraphDefinition>('/api/graph'),
  getLatest:    () => fetchJson<PipelineResult>('/api/pipeline/latest'),
  runPipeline:  () => fetchJson<PipelineResult>('/api/pipeline/run', { method: 'POST' }),
  trigger:      (triggerType: string, magnitude: number) =>
    fetchJson<PipelineResult>('/api/pipeline/trigger', {
      method: 'POST',
      body: JSON.stringify({ triggerType, magnitude }),
    }),
  getWeights:   () => fetchJson<CriteriaWeights>('/api/weights'),
  updateWeights: (weights: CriteriaWeights) =>
    fetchJson<PipelineResult>('/api/weights', {
      method: 'PUT',
      body: JSON.stringify(weights),
    }),
  listRecommendations: () => fetchJson<RecommendationEntity[]>('/api/recommendations'),
  approve: (id: string) =>
    fetchJson<{ status: string; recommendationId: string; sap: SapResult }>(
      `/api/recommendations/${id}/approve`,
      { method: 'POST' }
    ),
  reject: (id: string) =>
    fetchJson<{ status: string; recommendationId: string }>(
      `/api/recommendations/${id}/reject`,
      { method: 'POST' }
    ),
};

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPct(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}
