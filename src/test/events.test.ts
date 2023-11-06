import "mocha";
import assert from "assert";
import type {
  Network,
} from "../provider";

import type {
  EventFilter,
  BlockFilter,
} from '../provider/event';

import {
  BlockFinalityEmitter,
  LogEmitter,
} from "../provider";
import { PendingTransaction } from "../provider/transaction";
import { TransactOpts, CallOpts, Receipt } from "../provider/types";
import {
  BTPError,
  ERR_INCONSISTENT_BLOCK
} from "../error";
import { OpenAPIDocument } from "../service/description";

import { Provider } from "./utils/provider";
import { BlockChain } from "./utils/blockchain";
import { WebSocket as WebSock } from "./utils/ws";

describe("Test events", () => {
  const blockchain = new BlockChain({ period: 10 });
  const provider = new Provider(blockchain);
  describe("listen block finality event", () => {
    beforeEach(() => { blockchain.start() });
    afterEach(() => {
      blockchain.stop()
    });

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
          assert.ok(BTPError.is(error, ERR_INCONSISTENT_BLOCK));
          done()
        })
      }, 50);
    });
  });

});
