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
/**
 * Interface for classes that sign transactions
 *
 * @interface Signer
 */
/**
 * Returns supported network types by this signer
 *
 * @function
 * @name Signer#supports
 * @returns {Array<string>}
 */
/**
 * Returns address for the network type
 *
 * @async
 * @function
 * @name Signer#address
 * @returns {string}
 */
/**
 * Returns signature for the input message
 *
 * @async
 * @function
 * @name Signer#sign
 * @returns {string}
 */

export interface Signer {
  supports(): Array<string>;
  address(type: string): Promise<string>;
  sign(type: string, message: string): Promise<string>;
}

import {
  invalidArgument,
} from '../error/index';

/**
 * Signer utility class that has multiple signer objects
 *
 * @implements {Signer}
 */
export class Signers implements Signer {
  #signers: Array<Signer>;

  /**
   * Create Signers object
   *
   * @param {Array<Signer>} signers
   */
  constructor(...signers: Array<Signer>) {
    this.#signers = signers;
  }

  supports(): Array<string> {
    return this.#signers.map(s => s.supports()).flat();
  }

  async address(type: string): Promise<string> {
    return (this.#signers.find(s => s.supports().includes(type)) ?? (() => {
      throw invalidArgument(`unsupported network type(${type})`);
    })()).address(type);
  }

  async sign(type: string, message: string): Promise<string> {
    return (this.#signers.find(s => s.supports().includes(type)) ?? (() => {
      throw invalidArgument(`unsupported network type(${type})`);
    })()).sign(type, message);
  }
}
