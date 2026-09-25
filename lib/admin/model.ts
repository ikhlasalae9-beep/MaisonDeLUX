import metadata from '@/models/casablanca/v1/metadata.json';
import preprocessing from '@/models/casablanca/v1/preprocessing.json';

/** Artifact-backed registry only; database rows remain authoritative for operational state. */
export const modelRegistry = {
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
