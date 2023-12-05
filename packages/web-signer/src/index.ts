import {
  Signer,
  Signers,
  BtpError,
  ErrorCode,
  getLogger,
} from "@iconfoundation/btpsdk";

const log = getLogger('web-signer');

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

const compactSigMagicOffset = 27;

function recoverFlagToCompatible(signature: string) {
    let flag = parseInt(signature.substring(signature.length - 2), 16);
    if (flag >= compactSigMagicOffset) {
        flag = flag - compactSigMagicOffset;
        return signature.substring(0, signature.length - 2) + flag.toString(16).padStart(2, '0');
    }
    return signature;
}

export class WebMetamaskSigner implements Signer {
  constructor() {
    if (this.getProvider() == null || this.getProvider().isMetaMask != true) {
      throw new BtpError(ErrorCode.UnsupportedOperation, `no metamask`);
    }
  }

  getProvider() {
    return getGlobal().ethereum;
  }

  async connected(): Promise<boolean> {
    const accounts = await this.getProvider().request({ method: 'eth_accounts' });
    return accounts.length > 0;
  }

  async connect(): Promise<void> {
    try {
      log.debug('try to connect accounts on metamask');
      const addrs = await this.getProvider().request({ method: 'eth_requestAccounts' });
      log.debug('connected metamask accounts:', addrs);
    } catch (error) {
      if (error.code === 4001) {
        throw new BtpError(ErrorCode.Abort, error.message);
      } else {
        throw new BtpError(ErrorCode.UnknownError, 'fail to connect accounts of metamask', error);
      }
    }
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
    let addresses = [];
    try {
      addresses = await this.getProvider().request( { method: 'eth_requestAccounts' });
    } catch (error) {
      if (error.code === 4001) {
        throw new BtpError(ErrorCode.Abort, error.message);
      } else {
        throw new BtpError(ErrorCode.UnknownError, 'fail to connect accounts of metamask', error);
      }
    }
    if (addresses.length <= 0) {
      throw new BtpError(ErrorCode.IllegalState, 'no avail accounts');
    }
    return this._elect(addresses);
  }

  async sign(type: string, message: string): Promise<string> {
    const signature = await this.getProvider().request({
      method: 'eth_sign',
      params: [
        await this.address(type),
        '0x'+message,
      ]
    });
    return recoverFlagToCompatible(signature).slice(2);
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
    super(new WebIconHanaSigner(), new WebEvmHanaSigner());
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
        resolve();
      }
      global.addEventListener('ICONEX_RELAY_RESPONSE', fn, { once: true });
    });
  }

  supports(): Array<string> {
    return ['icon'];
  }

  async address(type: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const global = getGlobal();
      if (!global.dispatchEvent(new CustomEvent('ICONEX_RELAY_REQUEST', {
        detail: { type: 'REQUEST_ADDRESS' }
      }))) {
        return reject(new Error('fail to dispatch `ICONEX_RELAY_REQUEST::ADDRESS`'));
      }

      const fn = (ev: any) => {
        if (ev.detail.type !== 'RESPONSE_ADDRESS') {
          return;
        }
        global.removeEventListener('ICONEX_RELAY_RESPONSE', fn);
        resolve(ev.detail.payload);
      };

      global.addEventListener('ICONEX_RELAY_RESPONSE', fn);
    });
  }

  async sign(type: string, message: string): Promise<string> {
    const global = getGlobal();
    return new Promise(async (resolve, reject) => {
      const address = await this.address(type);
      if (!global.dispatchEvent(new CustomEvent('ICONEX_RELAY_REQUEST', {
        detail: {
          type: 'REQUEST_SIGNING',
          payload: {
            from: address,
            hash: message,
          }
        }
      }))) {
        return reject(new Error('fail to dispatch `ICONEX_RELAY_REQUEST::SIGNING'));
      }

      global.addEventListener('ICONEX_RELAY_RESPONSE', function fn (ev: any) {
        const { type, payload } = ev.detail;
        if (['RESPONSE_SIGNING', 'CANCEL_SIGNING'].includes(type)) {
          global.removeEventListener('ICONEX_RELAY_RESPONSE', fn);
          return type === 'RESPONSE_SIGNING' ? resolve(Buffer.from(payload, 'base64').toString('hex')) : reject(new Error('UserAbort'));
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
export class WebEvmHanaSigner extends WebMetamaskSigner {

  getProvider() {
    return getGlobal().hanaWallet?.ethereum;
  }

}
