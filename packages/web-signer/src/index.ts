import {
  Signer,
  Signers,
} from "@iconfoundation/btpsdk";

import {
  MetaMaskSDK
} from "@metamask/sdk";

/**
 * @namespace @iconfoundation/btpsdk-web-signer
 */

/**
 * signer class based on metamask chrome extension
 *
 * @class
 * @name WebMetamaskSigner
 * @implements {Signer}
 * @memberof @iconfoundation/btpsdk-web-signer
 */
export class WebMetamaskSigner implements Signer {
  #metamask: MetaMaskSDK

  constructor() {
    this.#metamask = new MetaMaskSDK({
      preferDesktop: false,
      storage: {
        enabled: true,
      },
      injectProvider: true,
      forceInjectProvider: false,
      enableDebug: true,
      shouldShimWeb3: true,
      dappMetadata: {
        name: '',
        url: '',
      },
      i18nOptions: {
        enabled: false,
      },
    });
    // {
    //   dappMetadata: {
    //     name: '',
    //     url: ''
    //   },
    //   preferDesktop: true,
    //   useDeeplink: true,
    //   extensionOnly: false,
    //   enableDebug: false,
    //   logging: {
    //     developerMode: true,
    //     sdk: true
    //   }
    // });
  }

  async init(): Promise<void> {
    console.log('MetamaskSigner::init');
    return new Promise(async (resolve, reject) => {
      const accounts = await this.#metamask.connect();
      if (accounts == null || (accounts as Array<string>).length <= 0) {
        this.#metamask.getProvider().once('accountsChanged', (accounts: any) => {
          if (accounts.length <= 0) {
            reject(new Error('no avail accounts'));
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  supports(): Array<string> {
    return ['evm', 'eth2', 'bsc'];
  }

  async address(type: string): Promise<string> {
    console.log('WebMetamaskSigner::address()');
    const provider = this.#metamask.getProvider();
    const accounts = await provider.request({ method: 'eth_accounts' }) as Array<string>;
    if (accounts.length <= 0) {
      throw new Error('no avail accounts');
    }
    return accounts[0];
  }

  async sign(type: string, message: string): Promise<string> {
    console.log('WebMetamaskSigner::sign()');
    const provider = this.#metamask.getProvider();
    const address = await this.address(type);
    try {
      const signature = await provider.request({
        method: 'eth_sign',
        params: [ address, '0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8' ]
      });
      return signature as string;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

function getGlobal(): any {
  if (typeof self !== 'undefined') { return self; }
  if (typeof window !== 'undefined') { return window; }
  if (typeof global !== 'undefined') { return global; }
  throw new Error('unable to locate global object');
}

/**
 * signer class based on hanawallet chrome extension
 *
 * @class
 * @name WebHanaSigner
 * @implements {Signer}
 * @memberof @iconfoundation/btpsdk-web-signer
 */
export class WebHanaSigner extends Signers {
  constructor() {
    super(Array.of(new WebIconHanaSigner(), new WebEvmHanaSigner()));
  }
}

// test with Hana Wallet v2.14.5
/**
 * signer class based on hanawallet chrome extension for icon network
 *
 * @class
 * @name WebIconHanaSigner
 * @implements {Signer}
 * @memberof @iconfoundation/btpsdk-web-signer
 */
export class WebIconHanaSigner implements Signer {

  async init(): Promise<void> {
    console.log('WebIconHanaSigner::init()');
    return new Promise((resolve, reject) => {
      const global = getGlobal();
      global.dispatchEvent(new CustomEvent('ICONEX_RELAY_REQUEST', {
        detail: { type: 'REQUEST_HAS_ADDRESS' }
      }));

      let timer = setTimeout(() => {
        reject(new Error('timeout iconex response'));
      }, 3000);
      function fn (ev: any) {
        clearTimeout(timer);
        console.log('ready to using icon wallet');
        resolve();
      }
      global.addEventListener('ICONEX_RELAY_RESPONSE', fn, { once: true });
    });
  }

  supports(): Array<string> {
    return ['icon'];
  }

  async address(type: string): Promise<string> {
    console.log('WebIconHanaSigner::address()');
    return new Promise((resolve, reject) => {
      const global = getGlobal();
      if (!global.dispatchEvent(new CustomEvent('ICONEX_RELAY_REQUEST', {
        detail: { type: 'REQUEST_ADDRESS' }
      }))) {
        return reject(new Error('fail to dispatch `ICONEX_RELAY_REQUEST::ADDRESS`'));
      }

      const fn = (ev: any) => {
        console.log('got address event:', ev);
        if (ev.detail.type !== 'RESPONSE_ADDRESS') {
          console.log('ignore unknown event1:', ev);
          return;
        }
        global.removeEventListener('ICONEX_RELAY_RESPONSE', fn);
        resolve(ev.detail.payload);
      };

      global.addEventListener('ICONEX_RELAY_RESPONSE', fn);
    });
  }

  async sign(type: string, message: string): Promise<string> {
    console.log('WebIconHanaSigner::sign()');
    const global = getGlobal();
    return new Promise(async (resolve, reject) => {
      const address = await this.address(type);
      if (!global.dispatchEvent(new CustomEvent('ICONEX_RELAY_REQUEST', {
        detail: {
          type: 'REQUEST_SIGNING',
          payload: {
            from: address,
            hash: '9babe5d2911e8e42dfad72a589202767f95c6fab49523cdc16279a7b8f82eab2',
          }
        }
      }))) {
        return reject(new Error('fail to dispatch `ICONEX_RELAY_REQUEST::SIGNING'));
      }

      global.addEventListener('ICONEX_RELAY_RESPONSE', function fn (ev: any) {
        const { type, payload } = ev.detail;
        if (['RESPONSE_SIGNING', 'CANCEL_SIGNING'].includes(type)) {
          global.removeEventListener('ICONEX_RELAY_RESPONSE', fn);
          return type === 'RESPONSE_SIGNING' ? resolve(payload) : reject(new Error('UserAbort'));
        }
      });
    });
  }
}

/**
 * signer class based on hanawallet chrome extension for evm networks
 *
 * @class
 * @name WebEvmHanaSigner
 * @implements {Signer}
 * @memberof @iconfoundation/btpsdk-web-signer
 */
export class WebEvmHanaSigner implements Signer {

  async init(): Promise<void> {
    console.log('WebEvmHanaSigner::init()');
    return new Promise((resolve, reject) => {
      // NOTE:) apis of provider are not working when no connected evm chains,
      // even if the provider is exists
      const provider = getGlobal().hanaWallet?.ethereum;
      console.log('evm provider:', provider);
      if (provider != null) {
        console.log('ready to using evm wallet');
        resolve();
      } else {
        reject(new Error('no evm provider on hana wallet'));
      }
    });
  }

  // strategy method for retrieve one of a number of addresses
  protected _elect(candidates: string | Array<string>): string {
    if (typeof(candidates) === 'string') {
      return candidates;
    } else {
      return candidates[0];
    }
  }

  supports(): Array<string> {
    return ['evm', 'eth2', 'bsc'];
  }

  async address(type: string): Promise<string> {
    console.log('WebEvmHanaWallet::address()');
    const provider = getGlobal().hanaWallet.ethereum;
    const addresses = await provider.request( { method: 'eth_requestAccounts' });
    if (addresses.length <= 0) {
      throw new Error('no avail accounts');
    }
    return this._elect(addresses);
  }

  async sign(type: string, message: string): Promise<string> {
    console.log('WebEvmHanaSigner::sign()');
    const provider = getGlobal().hanaWallet.ethereum;
    const signature = await provider.request({
      method: 'eth_sign',
      params: [
        await this.address(type),
        '0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8'
      ]
    });
    console.log('signature:', signature);
    return signature as string;
  }
}
