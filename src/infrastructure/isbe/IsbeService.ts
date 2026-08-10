import { IsbeConfigError, IsbeHTTPError } from './errors';

export interface IsbeTimestampResult {
  executionId: number;
  txHash: string;
  status: string;
}

export interface IsbeHashStatus {
  exists: boolean;
  timestamp: number | null;
}

// Own port for the ISBE HashTimestamp Application — deliberately separate
// from ICommunityService (Ethereum/Certificator11 evidence). Each provider
// is its own complete app with its own API, not a variant of the other:
// ISBE has no signature/KYC concept, it only notarizes a hash for the
// authenticated client (see ibs-backend/api/.../applications/controller.go).
export interface IsbeService {
  timestampHash(hash: string): Promise<IsbeTimestampResult>;
  getHashStatus(hash: string): Promise<IsbeHashStatus>;
}

export { IsbeConfigError, IsbeHTTPError };
