export { assert, BTPError, ERRORS } from "./errors";
export const query = {
  stringify: function stringify(qs: { [key: string]: any }, ns: string = '') {
    let r: string = '';
    for (const k in qs) {
      if (typeof(qs[k]) === 'string' || typeof(qs[k]) === 'number') {
        let key: string = ns.length > 0 ? `${ns}[${k}]` : `${k}`;
        let val: string = qs[k].toString();
        r += r.length > 0 ? '&' : '';
        r += `${key}=${val}`;
      } else if (qs[k] instanceof Array) {
        throw new Error('TODO');
      } else { // qs[k] instanceof Object
        r += r.length > 0 ? '&' : '';
        r += stringify(qs[k], ns.length > 0 ? `${ns}[${k}]` : k);
      }
    }
    return r;
  }
}

export const join = (...parts: Array<any>) => parts.join('/').replace(new RegExp('/' + '{1,}', 'g'), '/');

export const arrange = (v: any) => Array.isArray(v) ? v : Array.of(v);

// 
// export {
//   query
// }
