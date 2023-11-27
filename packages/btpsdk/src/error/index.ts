import {
  ErrorDescription,
  ERR_SERVER_REJECT,
} from './codes';

export * from './codes';

export function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new Error('AssertionError');
  }
}

export class BTPError extends Error {
  readonly code: number;

  constructor(description: ErrorDescription, args: { [ name: string ]: any } = {}) {
    super(typeof(description.message) === 'string' ? description.message : description.message(args) );
    this.code = description.code;
  }

  static is (other: any, description: ErrorDescription): other is BTPError {
    return other instanceof BTPError && other.code === description.code;
  }
}

export class ServerRejectError extends BTPError {
  readonly scode: number;
  readonly smessage: string;
  readonly data: any

  constructor(response: { code: number, message: string, data: any }) {
    super(ERR_SERVER_REJECT, response)
    this.scode = response.code;
    this.smessage = response.message;
    this.data = response.data;
  }
}
