import metadata from '@/models/casablanca/v1/metadata.json';
import preprocessing from '@/models/casablanca/v1/preprocessing.json';
import marrakechMetadata from '@/models/marrakech/v1/metadata.json';
import marrakechPreprocessing from '@/models/marrakech/v1/preprocessing.json';

/** Artifact-backed registry only; database rows remain authoritative for operational state. */
export const modelRegistry = {
  [marrakechMetadata.model_version]: {
    metadata: { artifact: marrakechMetadata.artifact, status: marrakechMetadata.status,
      metrics_status: marrakechMetadata.metrics_status, metrics_scope: marrakechMetadata.metrics_scope,
      notebook_reported_metrics: marrakechMetadata.notebook_reported_metrics,
      input_scope: 'Champs préparés requis; Loc_Type est dérivé par le service.',
    },
    logicalInputs: marrakechPreprocessing.required_prepared_fields,
    supportedPropertyTypes: marrakechPreprocessing.categorical.Type,
  },
  [metadata.model_version]: {
    metadata,
    logicalInputs: preprocessing.logical_inputs,
    supportedPropertyTypes: metadata.supported_property_types,
    academicApproval: { status: 'approved', label: 'Approuvé par le professeur encadrant' },
    lifecycle: {
      dataPreparation: 'completed',
      modelDevelopment: 'completed',
      academicApproval: 'completed',
      inferenceIntegration: 'not_integrated',
    },
  },
} as const;
export const modelMetadata = metadata;
