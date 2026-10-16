import 'server-only';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import metadata from '@/models/marrakech/v1/metadata.json';

/** Read-only integrity evidence; never loads/deserializes or activates an estimator. */
export function getModelIntegrity(version: string) {
  if (version !== metadata.model_version) return null;
  const matches = (file: string, expected: string) => {
    try { return createHash('sha256').update(readFileSync(path.join(process.cwd(), file))).digest('hex') === expected; }
    catch { return false; }
  };
  return { artifact: matches(metadata.artifact, metadata.artifact_sha256),
    preprocessing: matches(metadata.preprocessing, metadata.preprocessing_sha256), runtimeVerified: false };
}
