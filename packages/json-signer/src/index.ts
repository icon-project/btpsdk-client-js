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

import {
  Signer,
  invalidArgument,
} from '@iconfoundation/btpsdk';

import {
  Wallet as _IconWallet,
} from 'icon-sdk-js';

/**
 * Json wallet class compatible with icon networks
 *
 * @hideconstructor
 * @implements {Signer}
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
      throw invalidArgument(`unsupported network type(${type})`);
    }
    return this.#wallet.getAddress();
  }

  async sign (type: string, message: string): Promise<string> {
    return Buffer.from(this.#wallet.sign(message), 'base64').toString('hex');
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
      throw invalidArgument(`unsupported network type(${type})`);
    }
    return this.#wallet.address;
  }

  async sign (type: string, message: string): Promise<string> {
    return this.#wallet.signMessageSync(message.slice(2));
  }
}
