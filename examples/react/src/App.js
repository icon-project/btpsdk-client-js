import './App.css';
import {
  useReducer,
  useState,
  useEffect,
} from 'react';
import reducer from './reducer';
import keystores from './keystore';
import { BTPProvider } from '@iconfoundation/btpsdk';
import { IconWallet, EvmWallet } from '@iconfoundation/btpsdk-json-signer';
import { WebMetamaskSigner, WebHanaSigner } from '@iconfoundation/btpsdk-web-signer';

const DEFAULT_SERVER_URL = 'http://20.20.0.32:10080';

export default function App() {
  const [ state, dispatch ] = useReducer(reducer, {
    logs: [],
    networks: [],
    from: null,
    to: null,
  });

  const [ provider, setProvider ] = useState();
  useEffect(() => {
    setProvider(new BTPProvider(DEFAULT_SERVER_URL));
  }, []);

  useEffect(() => {
    if (provider == null) { return; }
    dispatch({ type: 'clear_logs' });
    (async () => {
      const bmc = await provider.service('bmc');
      const dapp = await provider.service('dappsample');

      let from = dapp.networks.find(network => network.type === 'icon');
      if (from != null) {
        from = dapp.at(from.name);
      } else {
        throw new Error('No sample contract on icon network');
      }

      let to = dapp.networks.find(network => network.type === 'bsc');
      if (to != null) {
        to = dapp.at(to.name);
      } else {
        throw new Error('No sample contract on bsc network');
      }

      dispatch({
        type: 'init',
        from: {
          bmc: bmc.at(from.network.name),
          dapp: dapp.at(from.network.name),
          wallets: [
            {
              name: 'Server Wallet',
              value: null
            }, {
              name: 'ICON Json Keystore',
              value: IconWallet.fromKeystore(JSON.stringify(keystores.ICON_KEYSTORE), keystores.ICON_PASSWORD),
            }, {
              name: 'Chrome Hana Wallet',
              value: new WebHanaSigner()
            }
          ]
        },
        to: {
          bmc: bmc.at(to.network.name),
          dapp: dapp.at(to.network.name),
          wallets: [
            {
              name: 'Chrome Metamask',
              value: new WebMetamaskSigner()
            }, {
              name: 'EVM Json Keystore',
              value: EvmWallet.fromKeystore(JSON.stringify(keystores.EVM_KEYSTORE), keystores.EVM_PASSWORD)
            }, {
              name: 'Chrome Hana Wallet',
              value: new WebHanaSigner()
            }
          ]
        },
        logs: []
      });
    })();
  }, [ provider ]);

  useEffect(() => {
    if (state.from == null || state.to == null) {
      return;
    }

    (async () => {
      {
        const address = await state.from.dapp.getBTPAddress();
        dispatch({
          type: 'add_log',
          log: `[FROM:DAPP]| address(${address.slice(0, 25) + '...'}) network(${state.from.dapp.network.name})`
        });
      }

      {
        const address = await state.to.dapp.getBTPAddress();
        dispatch({
          type: 'add_log',
          log: `[TO:DAPP]  | address(${address.slice(0, 25) + '...'}) network(${state.to.dapp.network.name})`
        });
      }
    })();
  }, [state.from, state.to]);

  async function handleSubmit(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const toaddr = await state.to.dapp.getBTPAddress();
    const pending = await state.from.dapp.sendMessage({
      _to: toaddr,
      _data: '0x' + Buffer.from(data.message).toString('hex'),
      _rollback: ''
    }, {
      signer: state.from.wallets.find(w => w.name === data.wallet).value
    });

    const receipt = await pending.wait();
    if (receipt.failure != null) {
      return dispatch({
        type: 'add_log',
        log: '[FROM:DAPP] Fail to `SendMessage`'
      });
    }

    dispatch({
      type: 'add_log',
      log: `[FROM:DAPP]| SendMessage(to(${(await state.to.dapp.getBTPAddress()).slice(0, 25) + '...'}), msg(${data.message}))`,
    });

    state.from.bmc.once('BTPEvent', (error, ev) => {
      dispatch({
        type: 'add_log',
        log: `[FROM:BMC] | BTPEvent(type(${ev.payload.params._event}), next(${ev.payload.params._next}))`
      });
    });

    state.to.bmc.once('BTPEvent', (error, ev) => {
      dispatch({
        type: 'add_log',
        log: `[TO:BMC]   | BTPEvent(type(${ev.payload.params._event}), next(${ev.payload.params._next}))`
      });
    });

    state.to.dapp.once('MessageReceived', (error, ev) => {
      dispatch({
        type: 'add_log',
        log: `[TO:DAPP]  | MessageReceived(from(${ev.payload.params._from}), msg(${atob(ev.payload.params._data)}))`
      });
    });
  }

  return (
    <div className='column'>
      <form onSubmit={(e) => {
        e.preventDefault();
        const { url } = Object.fromEntries((new FormData(e.target)).entries());
        setProvider(new BTPProvider(url));
      }}>
        <div className='row'>
          <div className='column'>
            <label>BTP Server URL</label>
            <input name='url' defaultValue={ DEFAULT_SERVER_URL } />
          </div>
          <button type='submit'>connect</button>
        </div>
      </form>
      <form onSubmit={handleSubmit}>
        <div className='row'>
          <div className='column'>
            <label>From</label>
            <input name='from' readOnly={true} value={state.from != null ? state.from.dapp.network.name : ''} />
          </div>
          <div className='column'>
            <button onClick={ (e) => {
              e.preventDefault();
              dispatch({
                type: 'change_network'
              });
            }}>{'<->'}</button>
          </div>
          <div className='column'>
            <label>To</label>
            <input name='to' readOnly={true} value={state.to != null ? state.to.dapp.network.name : ''} />
          </div>
        </div>

        <div className='row'>
          <div className='column'>
            <label>Wallet</label>
            <select name='wallet'>
              {
                (() => {
                  if (state.from != null) {
                    return state.from.wallets.map(w => {
                      return (<option key={ w.name }>{ w.name }</option>)
                    });
                  } else {
                    return (<option key={0}>{ 'no wallet' }</option>)
                  }
                })()
              }
            </select>
          </div>
        </div>
        <div className='row'>
          <div className='column'>
            <label> Message </label>
            <input name='message'/>
          </div>
        </div>
        <div className='row'>
          <div className='column'>
            <button type='submit' disabled={ state.from == null }>Send</button>
          </div>
        </div>
        <div className='row'>
          <div className='column'>
            <textarea className='log' rows={20} readOnly={ true } value={ state.logs.join("\n") } />
          </div>
        </div>
        <div className='row'>
          <div className='column'>
            <button onClick={ () => { dispatch({ type: 'clear_logs' }) }}>Clear Logs</button>
          </div>
        </div>
      </form>
    </div>
  );
}
