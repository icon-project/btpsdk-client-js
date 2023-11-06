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
  readonly message: string;

  constructor(description: ErrorDescription, args: { [ name: string ]: any } = {}) {
    super(typeof(description.message) === 'string' ? description.message : description.message(args) );
    this.code = description.code;
    this.message = super.message;
  }

  static is (other: any, description: ErrorDescription): other is BTPError {
    return other instanceof BTPError && other.code === description.code;
  }
}

export class ServerRejectError extends BTPError {
  readonly statusCode: number;
  readonly responseMessage: string;

  constructor(response: { code: number, message: string }) {
    super(ERR_SERVER_REJECT, response)
    this.statusCode = response.code;
    this.responseMessage = response.message;
  }
}
