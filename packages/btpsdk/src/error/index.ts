export enum ErrorCode {
  UnknownError = 'UnknownError',
  Assert = 'Assert',
  MalformedData = 'MalformedData',
  InconsistentBlock = 'InconsistentBlock',
  ServerError = 'ServerError',
  InvalidArgument = 'InvalidArgument',
  IllegalState = 'IllegalState',
  ClosedConnection = 'Closedconnection',
  UnsupportedOperation = 'UnsupportedOperation',
  Timeout = 'Timeout',
  Abort = 'Abort',
  TODO = 'TODO'
}

export class BtpError extends Error {
  readonly code: ErrorCode

  constructor(code: ErrorCode, message: string = code, cause?: Error) {
    super(`${code}: ${message}`, { cause });
    this.code = code;
    this.name = this.constructor.name;
  }
}

export class ServerError extends BtpError {
  readonly payload: {
    code: number;
    message: string;
    data: any;
  }

  constructor(response: { code: number, message: string, data: any }) {
    super(ErrorCode.ServerError, response.message);
    this.payload = {
      code: response.code,
      message: response.message,
      data: response.data
    };
  }
}

export function assert(condition: boolean, message: string = '', code: ErrorCode = ErrorCode.Assert): void {
  if (!condition) {
    throw new BtpError(code, `${code}: ${message}`);
  }
}

export function invalidArgument(message: string): void {
  throw new BtpError(ErrorCode.InvalidArgument, message);
}
