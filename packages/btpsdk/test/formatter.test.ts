import { read } from './utils';
import { NetworkType } from '../src/provider/index';
import { BTPError, ERR_UNKNOWN_NETWORK_TYPE } from '../src/error/index';
import {
  formatReceipt,
  formatEventLog,
} from '../src/provider/format';

describe('Test data converter/formatter for network-specific data formats', () => {
  it('format icon receipt', () => {
    const receipt = JSON.parse(read('receipt.icon.json').toString());
    expect(formatReceipt('icon' as NetworkType, receipt)).toEqual({
      block: {
        id: receipt.BlockHash,
        height: receipt.BlockHeight
      },
      cumulativeUsed: receipt.Raw.cumulativeStepUsed,
      used: receipt.Raw.stepUsed,
      price: receipt.Raw.stepPrice,
      logs: [
        {
          "scoreAddress": "cx0000000000000000000000000000000000000000",
          "indexed": [ "BTPMessage(int,int)","0x20","0xff" ],
          "data": []
        }, {
          "scoreAddress": "cx2093dd8134f26df11aa928c86b6f5bac64a1cf83",
          "indexed": [ "BTPEvent(str,int,str,str)","0x3.icon","0x11e" ],
          "data": [ "0x63.bsc","SEND" ]
        }, {
          "scoreAddress": "cx784b438d386170c24a12d4de3df9809d066b6258",
          "indexed": [
            "CallMessageSent(Address,str,int,int)",
            "cx5ae6a222e82136f9dedec54b76047e7e62faf9a6",
            "btp://0x63.bsc/0x87a84eA22Dcc1bA533c5d90fd1Ee687aF73f9948",
            "0x10c"
          ],
          "data": [ "0x11e" ]
        }, {
          "scoreAddress": "cx5ae6a222e82136f9dedec54b76047e7e62faf9a6",
          "indexed": [ "Sent(str,int,int,int)" ],
          "data": [
            "btp://0x63.bsc/0x87a84eA22Dcc1bA533c5d90fd1Ee687aF73f9948",
            "0xae",
            "0x1",
            "0x10c"
          ]
        }
      ]
    })
  });

  it('format evm receipt', () => {
    const receipt = JSON.parse(read('receipt.bsc.json').toString());
    expect(formatReceipt('bsc' as NetworkType, receipt)).toEqual({
      block: {
        id: receipt.Raw.blockHash,
        height: Number.parseInt(receipt.Raw.blockNumber, 16)
      },
      cumulativeUsed: receipt.Raw.cumulativeGasUsed,
      used: receipt.Raw.gasUsed,
      price: receipt.Raw.effectiveGasPrice,
      logs: [
        {
          "address": "0x6d80e9654e409c8dee65f64f3a029962682940fe",
          "topics": [
            "0x37be353f216cf7e33639101fd610c542e6a0c0109173fa1c1d8b04d34edb7c1b",
            "0x87e23cd390e4d9b7cac91f032ac322c76d529ddc95e5a1e5fe87500b5a745f06",
            "0x0000000000000000000000000000000000000000000000000000000000000103"
          ],
          "data": "0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000098f89688307836332e627363883078332e69636f6e857863616c6c58b86ff86d01b86af868aa307838376138346541323244636331624135333363356439306664314565363837614637336639393438aa63783561653661323232653832313336663964656465633534623736303437653765363266616639613658018fce588c73686f756c6452657665727459ca88307836332e627363c00000000000000000",
          "blockNumber": "0x279e72",
          "transactionHash": "0xaf09d510467a06527c7184a6bc6af0336065a637ca94d33e8fc9a9543ac6b63b",
          "transactionIndex": "0x0",
          "blockHash": "0x680239b0c9d810528ca069e298274b17a7a304136add9c6d3c50687d89e86ca0",
          "logIndex": "0x0",
          "removed": false
        }, {
          "address": "0x6d80e9654e409c8dee65f64f3a029962682940fe",
          "topics": [
            "0x51f135d1c44e53689ca91af3b1bce4918d2b590d92bb76a854ab30e7de741828",
            "0x6e1f2539dbb6cb31aa50b4717b723c84db697f58577f8f679a0105bcfab5c894",
            "0x0000000000000000000000000000000000000000000000000000000000000059"
          ],
          "data": "0x0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000083078332e69636f6e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000453454e4400000000000000000000000000000000000000000000000000000000",
          "blockNumber": "0x279e72",
          "transactionHash": "0xaf09d510467a06527c7184a6bc6af0336065a637ca94d33e8fc9a9543ac6b63b",
          "transactionIndex": "0x0",
          "blockHash": "0x680239b0c9d810528ca069e298274b17a7a304136add9c6d3c50687d89e86ca0",
          "logIndex": "0x1",
          "removed": false
        }, {
          "address": "0x022e1e014039072facc383596be83866c04cfa10",
          "topics": [
            "0x30bd7b24c8b4484378d242d4b94ef187d71ef050444e6b1bd9b18d1b75a29438",
            "0x00000000000000000000000087a84ea22dcc1ba533c5d90fd1ee687af73f9948",
            "0x10b0f04959102703348e8f62258a590d4339302d4ef5619817c27ae3c813c053",
            "0x0000000000000000000000000000000000000000000000000000000000000058"
          ],
          "data": "0x0000000000000000000000000000000000000000000000000000000000000059",
          "blockNumber": "0x279e72",
          "transactionHash": "0xaf09d510467a06527c7184a6bc6af0336065a637ca94d33e8fc9a9543ac6b63b",
          "transactionIndex": "0x0",
          "blockHash": "0x680239b0c9d810528ca069e298274b17a7a304136add9c6d3c50687d89e86ca0",
          "logIndex": "0x2", "removed": false
        }, {
          "address": "0x87a84ea22dcc1ba533c5d90fd1ee687af73f9948",
          "topics": ["0x4e1f27cc2ff3a98b4f69464d822dfb0445b5cae1b3c80cece0d4a34858cc8560"],
          "data": "0x000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000580000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000005800000000000000000000000000000000000000000000000000000000000000396274703a2f2f3078332e69636f6e2f63783561653661323232653832313336663964656465633534623736303437653765363266616639613600000000000000",
          "blockNumber": "0x279e72",
          "transactionHash": "0xaf09d510467a06527c7184a6bc6af0336065a637ca94d33e8fc9a9543ac6b63b",
          "transactionIndex": "0x0",
          "blockHash": "0x680239b0c9d810528ca069e298274b17a7a304136add9c6d3c50687d89e86ca0",
          "logIndex": "0x3",
          "removed": false
        }
      ]
    })
  });

  it('format icon eventlog', () => {
    const eventlog = JSON.parse(read('eventlog.icon.json').toString());
    expect(formatEventLog('icon' as NetworkType, eventlog)).toEqual({
      block: {
        id: eventlog.BaseEvent.BlockHash,
        height: eventlog.BaseEvent.BlockHeight
      },
      tx: {
        id: eventlog.BaseEvent.TxHash,
        index: eventlog.BaseEvent.TxIndex,
      },
      index: eventlog.BaseEvent.IndexInTx,
      payload: {
        name: eventlog.Name,
        params: eventlog.Params,
      }
    });
  });

  it('format evm eventlog', () => {
    const eventlog = JSON.parse(read('eventlog.bsc.json').toString());
    expect(formatEventLog('bsc' as NetworkType, eventlog)).toEqual({
      block: {
        id: eventlog.BaseEvent.Raw.blockHash,
        height: Number.parseInt(eventlog.BaseEvent.Raw.blockNumber, 16),
      },
      tx: {
        id: eventlog.BaseEvent.Raw.transactionHash,
        index: Number.parseInt(eventlog.BaseEvent.Raw.transactionIndex, 16),
      },
      index: Number.parseInt(eventlog.BaseEvent.Raw.logIndex, 16),
      payload: {
        name: eventlog.Name,
        params: eventlog.Params,
      }
    });
  });

  it('try to formatting data with unknown network type', () => {
    const type = 'unknown' as NetworkType;
    expect(() => { formatReceipt(type, JSON.parse(read('receipt.icon.json').toString())) })
      .toThrow(new BTPError(ERR_UNKNOWN_NETWORK_TYPE, { type }));

    expect(() => { formatEventLog(type, JSON.parse(read('eventlog.icon.json').toString())) })
      .toThrow(new BTPError(ERR_UNKNOWN_NETWORK_TYPE, { type }));
  });

});
