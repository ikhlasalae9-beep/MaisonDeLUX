/** Rabat training diagnostics can never fall through into independent performance cards. */
export function modelPerformanceMetrics(model: { version: string; documented_metadata?: any; metrics?: any }): Record<string, unknown> {
  const documentation = model.documented_metadata || {};
  if (model.version === 'rabat-random-forest-v1') return documentation.independent_test_metrics || {};
  return documentation.notebook_reported_metrics || model.metrics || {};
}

export type TrainingDiagnostics = {
  r2_mad: number; mae_mad: number; rmse_mad: number; median_ape_percent: number;
  sample_count: number; scope: 'training_set_resubstitution'; independent_test: false; source: string;
};

/** Only the explicitly scoped Supabase record supplies training diagnostics; no manifest fallback. */
export function rabatTrainingDiagnostics(model: { version: string; metrics?: any }): TrainingDiagnostics | null {
  if (model.version !== 'rabat-random-forest-v1') return null;
  const value = model.metrics?.training_diagnostics;
  if (!value || value.scope !== 'training_set_resubstitution' || value.independent_test !== false ||
      !Number.isInteger(value.sample_count) || value.sample_count <= 0 ||
      typeof value.source !== 'string' || !value.source.trim() ||
      !['r2_mad', 'mae_mad', 'rmse_mad', 'median_ape_percent'].every(key => typeof value[key] === 'number' && Number.isFinite(value[key])) ||
      value.r2_mad > 1 || value.mae_mad < 0 || value.rmse_mad < 0 || value.median_ape_percent < 0) return null;
  return value as TrainingDiagnostics;
}
