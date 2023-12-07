/*
 * Copyright 2023 ICON Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
