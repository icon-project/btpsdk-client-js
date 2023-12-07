/*
 * Copyright 2023 ICON Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export * from './log';

export function qs (kvs: { [key: string]: any }, ns: string = '') {
  let r: string = '';
  for (const k in kvs) {
    if (typeof(kvs[k]) === 'string' || typeof(kvs[k]) === 'number') {
      const key: string = ns.length > 0 ? `${ns}[${k}]` : `${k}`;
      const val: string = (kvs[k] as string | number).toString();
      r += r.length > 0 ? '&' : '';
      r += `${key}=${val}`;
    } else if (kvs[k] instanceof Array) {
      throw new Error('TODO');
    } else { // kvs[k] instanceof Object
      r += r.length > 0 ? '&' : '';
      r += qs(kvs[k], ns.length > 0 ? `${ns}[${k}]` : k);
    }
  }
  return r;
}

export const join = (...parts: Array<any>) => parts.join('/').replace(new RegExp('/' + '{1,}', 'g'), '/');

export const arrange = (v: any) => Array.isArray(v) ? v : Array.of(v);

export const merge = (...objects: Array<any>) => {
  const isObject = (obj: any) => obj && typeof obj === 'object';

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach(key => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = pVal.concat(...oVal);
      }
      else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = merge(pVal, oVal);
      }
      else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
}

export const base64ToHex = (base64: string) => {
  return '0x' + atob(base64).split('').map((m) => ('0' + m.charCodeAt(0).toString(16)).slice(-2)).join('');
}
