import mocha from 'mocha';
import {
  BlockChain,
} from './utils/blockchain';

describe('blockchain test', () => {
  it('', () => {
    const blockchain = new BlockChain();
    blockchain.start();
    blockchain.on('created', (block) => {
      console.log('new block:', block);
    });
  });
});
