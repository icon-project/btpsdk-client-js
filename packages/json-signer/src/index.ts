import { Signer } from '@iconfoundation/btpsdk';

import { Wallet as _IconWallet } from 'icon-sdk-js';

/**
 * @namespace @iconfoundation/btpsdk-json-signer
 */

/**
 * Json wallet class compatible with icon networks
 *
 * @hideconstructor
 * @implements {Signer}
 * @memberof @iconfoundation/btpsdk-json-signer
 */
export class IconWallet implements Signer {
  #wallet: _IconWallet;

  private constructor(wallet: _IconWallet) {
    this.#wallet = wallet;
  }

  /**
   * Create IconWallet object
   *
   * @param {object} json - json object for keystore
   * @param {string} password - keystore password
   * @memberof IconWallet
   * @static
   */
  static fromKeystore(json: any, password: string): IconWallet {
    return new IconWallet(_IconWallet.loadKeystore(json, password, true));
  }

  async init (): Promise<void> {
    return;
  }

  supports(): Array<string> {
    return [ 'icon' ];
  }

  async address (type: string): Promise<string> {
    if (type != 'icon') {
      throw new Error('not supported network');
    }
    return this.#wallet.getAddress();
  }

  async sign (type: string, message: string): Promise<string> {
    return this.#wallet.sign(message);
  }
}

import {
  Wallet as _EvmWallet,
  HDNodeWallet as _EvmHDNodeWallet,
} from 'ethers';

/**
 * Json wallet class compatible with evm networks
 *
 * @hideconstructor
 * @implements {Signer}
 * @memberof @iconfoundation/btpsdk-json-signer
 */
export class EvmWallet implements Signer {
  #wallet: _EvmWallet | _EvmHDNodeWallet;
  private constructor(wallet: _EvmWallet | _EvmHDNodeWallet) {
    this.#wallet = wallet;
  }

  /**
   * Create `EvmWallet` object
   *
   * @param {object} json - json object for keystore
   * @param {string} password - keystore password
   * @memberof EvmWallet
   * @static
   */
  static fromKeystore(json: any, password: string): EvmWallet {
    return new EvmWallet(_EvmWallet.fromEncryptedJsonSync(json, password));
  }

  async init (): Promise<void> {
    return;
  }

  supports(): Array<string> {
    return [ 'evm', 'eth', 'eth2', 'bsc' ];
  }

  async address (type: string): Promise<string> {
    if (!this.supports().includes(type)) {
      throw new Error('not supported network');
    }
    return this.#wallet.address;
  }

  async sign (type: string, message: string): Promise<string> {
    return this.#wallet.signMessageSync(message);
  }
}
