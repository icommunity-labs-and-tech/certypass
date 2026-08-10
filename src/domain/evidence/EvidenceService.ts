import { EvidenceInputError, ImageFetchError, ImageSizeExceededError, EvidenceBuildError } from './errors';
import { ICommunityConfigError, ICommunityHTTPError } from '../../infrastructure/icommunity/errors';
import type { ICommunityService } from '../../infrastructure/icommunity/ICommunityService';

export interface EvidencePayloadInput {
  signatureID: string;
  title: string;
  description: string;
  imageUrls: string[];
  metadata: Record<string, unknown>;
}

export interface EvidenceFile {
  name: string;
  file: string; // base64 encoded
}

export interface EvidenceResult {
  evidenceId: string;
  /** sha256 (0x-prefixed hex) of the item_data.json/issue_data.json exactly as uploaded — usable as-is for ISBE's timestampHash. */
  contentHash: string;
}

export interface EvidenceService {
  createItemEvidence(
    input: EvidencePayloadInput
  ): Promise<EvidenceResult>;
  createStateEvidence(
    input: EvidencePayloadInput
  ): Promise<EvidenceResult>;
}
