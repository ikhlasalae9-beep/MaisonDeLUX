/** Rabat training diagnostics can never fall through into independent performance cards. */
export function modelPerformanceMetrics(model: { version: string; documented_metadata?: any; metrics?: any }): Record<string, unknown> {
  const documentation = model.documented_metadata || {};
  if (model.version === 'rabat-random-forest-v1') return documentation.independent_test_metrics || {};
  return documentation.notebook_reported_metrics || model.metrics || {};
}
