import {
  BlockFinalityEmitter,
  // LogEmitter,
} from "../src/provider";

import {
  BTPError,
  ERR_INCONSISTENT_BLOCK
} from "../src/error";

import { Provider } from "./utils/provider";
import { BlockChain } from "./utils/blockchain";

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
          expect(error).toBe(undefined);
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
          expect(BTPError.is(error, ERR_INCONSISTENT_BLOCK)).toBe(true);
          done()
        })
      }, 50);
    });
  });

});
