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
  init(): Promise<void>;
  supports(): Array<string>;
  address(type: string): Promise<string>;
  sign(type: string, message: string): Promise<string>;
}

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
  constructor(signers: Array<Signer>) {
    this.#signers = signers;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      Promise.all(this.#signers.map(s => s.init)).then(() => resolve());
    });
  }

  supports(): Array<string> {
    return this.#signers.map(s => s.supports()).flat();
  }

  async address(type: string): Promise<string> {
    return (this.#signers.find(s => s.supports().includes(type)) ?? (() => {
      throw new Error('Unsupported Network Type');
    })()).address(type);
  }

  async sign(type: string, message: string): Promise<string> {
    return (this.#signers.find(s => s.supports().includes(type)) ?? (() => {
      throw new Error('Unsupported Network Type');
    })()).sign(type, message);
  }
}
