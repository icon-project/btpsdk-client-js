import {
  assert,
  BTPError,
  Signer,
  ERRORS
} from "btp";

import detect from "@metamask/detect-provider";

import {
  SDKProvider,
  MetaMaskSDK
} from "@metamask/sdk";

export class WebMetamaskSigner implements Signer {
  #metamask: MetaMaskSDK

  constructor() {
    this.#metamask = new MetaMaskSDK({
      dappMetadata: {
        name: '',
        url: ''
      },
      enableDebug: false,
      logging: {
        developerMode: true,
        sdk: true
      }
    });

  }

  async address(): Promise<string> {
    let accounts: Array<string> = [];
    try {
      console.log('try init ...');
      await this.#metamask.init();

      const provider = this.#metamask.getProvider();
      console.log('provider:', provider);
      provider.on('accountsChagned', (accounts) => {
        console.log('accountsChanged:', accounts);
      });

      provider.on('chainChanged', (chainId) => {
        console.log('chainChanged:', chainId);
      });

      provider.on('connect', () => {
        console.log('connect');
      });

      provider.on('disconnect', () => {
        console.log('disconnect');
      });

      provider.on('message', (message) => {
        console.log('message:', message);
      });

      //accounts = await this.#metamask.connect() as Array<string>;
      //console.log('accounts::connect:', accounts);
      console.log('init complete...');
    } catch (error) {
      console.log('CATCH METAMASK INIT ERR:', error);
    }

    // if (accounts.length <= 0) {
    //   await this.#metamask.getProvider().request({
    //     method: 'wallet_requestPermissions',
    //     params: [{ eth_accounts: {} }]
    //   });
    // }

    accounts = await this.#metamask.getProvider().request({
      method: 'eth_accounts'
    }) as Array<string>;
    console.log('accounts:eth_accounts:', accounts);
    if (accounts.length <= 0) {
      throw new Error("no avail account")
    }
    return accounts[0];
  }

  async sign(type: string, message: string): Promise<string> {
    //const provider = await detect() as SDKProvider;
    //const provider = createMetaMaskProvider();
    const address = await this.address();
    const signature = this.#metamask.getProvider().request({
    //const signature = await provider.request({
      method: 'eth_sign',
      params: [ address, message ]
    });
    console.log('signature:', signature);
    throw new Error('TODO: WebMetamaskSigner::sign');
  }
}

function getGlobal(): any {
  if (typeof self !== 'undefined') { return self; }
  if (typeof window !== 'undefined') { return window; }
  if (typeof global !== 'undefined') { return global; }
  throw new Error('unable to locate global object');
}


export class WebHanaSigner implements Signer {
  async address(): Promise<string> {
    return new Promise((resolve, reject) => {
      const global = getGlobal();
      const dbg_ev = global.dispatchEvent(new CustomEvent('ICONEX_RELAY_REQUEST', {
        detail: { type: 'REQUEST_ADDRESS' }
      }));
      console.log('dispatch event ret:', dbg_ev);

      globalThis.addEventListener('ICONEX_RELAY_RESPONSE', (ev: any) => {
        console.log('RESPONSE ev:', ev);
        resolve(ev.detail.payload);
      }, { once: true });
    });
  }

  async sign(type: string, message: string): Promise<string> {
    throw new Error('');
  }
}
