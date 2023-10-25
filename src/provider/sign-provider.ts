
import {
  Network,
  Signer,
  TransactOpts,
} from "./types";
import { DefaultProvider } from "./provider";
import {
  PendingTransaction,
} from "./transaction";

function b64ToHex(b64: string) {
    return '0x' + atob(b64).split('').map((m) => ('0' + m.charCodeAt(0).toString(16)).slice(-2)).join('');
}

export class SigningProvider extends DefaultProvider {
  constructor(url: string, signer: Signer) {
    super(url, signer);
  }

  override async transact(network: Network | string, service: string, method: string, params: { [key: string]: any }, options: TransactOpts): Promise<PendingTransaction> {
    console.log('signing-provider transact options:', options);
    const encoder = new TextEncoder();
    const resp = await this.fetcher.send({
      path: `/api/${service}/${method}`,
      method: 'POST',
      headers: {},
      body: encoder.encode(JSON.stringify({
        network: typeof(network) === 'string' ? network : network.name,
        params,
        options: Object.assign(options, {
          from: await super.signer.address(),
        }),
      })),
    });

    const tx = JSON.parse(new TextDecoder().decode(resp.body));
    const response = JSON.parse(resp.body!!.toString());
    console.log('first req:', response);
    console.log('hex:', b64ToHex(response.data.data));
    const resp2 = await this.fetcher.send({
      path: `/api/${service}/${method}`,
      method: 'POST',
      headers: {},
      body: encoder.encode(JSON.stringify({
        network: typeof(network) === 'string' ? network : network.name,
        params,
        options: Object.assign(options, {
          from: await super.signer.address(),
          signature: await super.signer.sign('icon', tx)
        }),
      })),
    });
    const txid = JSON.parse(new TextDecoder().decode(resp2.body));
    return new PendingTransaction(this, typeof(network) === 'string' ? {
      name: network,
      // TODO
      type: 'icon',
    } : network, txid);
  }
}
