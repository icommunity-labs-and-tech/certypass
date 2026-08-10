export class IsbeConfigError extends Error {
  readonly _tag = 'IsbeConfigError';
  constructor(message: string) {
    super(message);
    this.name = 'IsbeConfigError';
  }
}

export class IsbeHTTPError extends Error {
  readonly _tag = 'IsbeHTTPError';
  constructor(public readonly operation: 'timestampHash' | 'getHashStatus', message: string, public readonly status?: number, public readonly response?: unknown) {
    super(message);
    this.name = 'IsbeHTTPError';
  }
}
