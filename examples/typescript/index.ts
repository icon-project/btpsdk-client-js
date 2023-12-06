import {
  BTPProvider,
  BtpError,
} from '@iconfoundation/btpsdk';

const SERVER_URL = process.env.BTP_SERVER_URL || (() => { throw new Error('no server url') })();

(async () => {
  // create btp provider
  const provider = new BTPProvider(SERVER_URL);

  // retrieve all services
  const services = await provider.services();
  console.log('all services registered in the btpsdk server');
  for (const service of services) {
    console.log('name:', service.name);
    console.log('available networks');
    for (const network of service.networks) {
      console.log(`\tname: ${network.name} type: ${network.type}`);
    }
  }

  // retrieve `bmc` service
  const bmc = await provider.service('bmc');

  // register event listeners to `bmc` service

  // listen `BTPEvent` event of `bmc` service on `icon_test` network
  bmc.once('icon_test', 'BTPEvent', (error, event) => {
    console.log('ICON BTPEvent:', error, event);
  });

  // listen `BTPEvent` event of `bmc` service on `bsc_test` network
  bmc.once('bsc_test', 'BTPEvent', (error, event) => {
    console.log('BSC BTPEvent:', error, event);
  });

  // listen `Message` event of `bmc` service on `icon_test` network
  // bmc.once('icon_test', 'Message', (error, event) => {
  //   console.log('ICON Message:', error, event);
  // });

  // listen `Message` event of `bmc` service on `bsc_test` network
  bmc.once('bsc_test', 'Message', (error, event) => {
    console.log('BSC Message:', error, event);
  });


  // retrieve `dappsample` service
  const dappsample = await provider.service('dappsample');

  // retrieve `dappsample` contract
  const icon = dappsample.at('icon_test');
  const bsc = dappsample.at('bsc_test');

  // retrieve btp address of `dappsample` contract on `icon_test` network
  // by using `getBTPAddress` readonly function defined in `dappsample` service
  const ICON_DAPP_ADDR = await icon.getBTPAddress();
  console.log('btp address of icon dapp:', ICON_DAPP_ADDR);

  const BSC_DAPP_ADDR = await bsc.getBTPAddress();
  console.log('btp address of bsc dapp:', BSC_DAPP_ADDR);

  // `dappsample` contract on `bsc` network sends message to a `dappsample` on `icon` network
  // by using `sendMessage(_to, _data, _rollback)` writable function defined in `dappsample` service
  const tx = await bsc.sendMessage({
    _to: ICON_DAPP_ADDR,
    _data: '0x' + Buffer.from('Hello ICON Dapp').toString('hex'),
    _rollback: ''
  });

  console.log('a pending transaction id:', tx.id);

  // retrieve a receipt for the transaction
  // let receipt = await tx.wait();
  // or wait until the transaction has been finalized
  let receipt = await tx.wait('finalized');
  console.log('a receipt of the transaction:', receipt);
})();
