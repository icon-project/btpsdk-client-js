import "mocha";
import assert from "assert";
import type {
  BlockFilter,
  Network,
} from "../provider";
import {
  BlockFinalityEmitter,
  LogEmitter,
} from "../provider";
import { PendingTransaction } from "../provider/transaction";
import { TransactOpts, CallOpts, Receipt, EventFilter } from "../provider/types";
import { Service } from "../service/service";
import { ServiceDescription, Listener } from "../service/types";
import { read } from "./utils";
import { BTPError, ERRORS } from "../utils/errors";
import { OpenAPIDocument } from "../service/description";

import { Provider } from "./utils/provider";
import { BlockChain } from "./utils/blockchain";
import { WebSocket as WebSock } from "./utils/ws";

describe("Test events", () => {
  const blockchain = new BlockChain({ period: 10 });
  const provider = new Provider(blockchain);
  describe("listen block finality event", () => {
    beforeEach(() => { blockchain.start() });
    afterEach(() => { blockchain.stop() });

    it('receive block finality event', (done) => {
      const emitter = new BlockFinalityEmitter(provider, { interval: 10 });
      setTimeout(() => {
        emitter.once('block', {
          network: 'icon:berlin',
          status: 'finalized',
          id: blockchain.created().id,
          height: blockchain.created().height
        }, (error) => {
          assert.ok(error == null);
          done();
        })
      }, 100);
    });

    it('receive an inconsistent block error when listening to block finality event with wrong block hash', (done) => {
      const emitter = new BlockFinalityEmitter(provider, { interval: 10 });
      setTimeout(() => {
        emitter.once('block', {
          network: 'icon:berlin',
          status: 'finalized',
          id: blockchain.created().id,
          height: blockchain.created().height + 1
        }, (error) => {
          assert.ok(BTPError.is(error, ERRORS.NETWORK.INCONSISTENT_BLOCK));
          done()
        })
      }, 100);
    });
  });

  describe("listen event logs", () => {
    it('receive event log', (done) => {
      const emitter = new LogEmitter(() => new WebSock());
      emitter.on('log', {
        network: {
          name: 'icon:berlin',
          type: 'icon'
        },
        service: 'token',
        event: {
          name: 'Transfer',
        }
      }, (...args: Array<any>) => {
      })
    });
  });


  // it('define dynamic methods of a service', async () => {
  //   const provider = new DummyProvider();
  //   const doc = OpenAPIDocument.from(JSON.parse(read("api-document.json").toString()));
  //   const desc = doc.service('dappsample');
  //   const service = new Service(provider, desc);
  //   desc.methods.forEach((m) => {
  //     assert.equal(typeof(service[m.name]), 'function');
  //   });
  // })

  // it('resolve contract', async () => {
  //   const provider = new DummyProvider();
  //   const doc = OpenAPIDocument.from(JSON.parse(read("api-document.json").toString()));
  //   const desc = doc.service('dappsample');
  //   const service = new Service(provider, desc);
  //   const contract = service.at('icon_test');
  //   desc.methods.forEach((m) => {
  //     assert.equal(typeof(contract[m.name]), 'function');
  //   });
  // });
});
