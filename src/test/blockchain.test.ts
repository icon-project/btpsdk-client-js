import 'mocha';
import {
  BlockChain,
} from './utils/blockchain';

describe.skip('blockchain test', () => {
  it('', () => {
    const blockchain = new BlockChain();
    blockchain.start();
    blockchain.on('created', (block) => {
      console.log('new block:', block);
    });
  });
});
