/**
 * Interface for classes that sign transactions
 *
 * @interface Signer
 * @memberof @iconfoundation/btpsdk
 */
/**
 * Initialize signer object
 *
 * @async
 * @function
 * @name Signer#init
 * @returns {void}
 * @throws {TODO}
 */
/**
 * Returns supported network types by this signer
 *
 * @function
 * @name Signer#supports
 * @returns {Array<string>}
 * @throws {TODO}
 */
/**
 * Returns address for the network type
 *
 * @async
 * @function
 * @name Signer#address
 * @returns {string}
 * @throws {TODO}
 */
/**
 * Returns signature for the input message
 *
 * @async
 * @function
 * @name Signer#sign
 * @returns {string}
 * @throws {TODO}
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
 * @memberof @iconfoundation/btpsdk
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
