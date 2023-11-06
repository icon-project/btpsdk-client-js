import 'mocha';
import assert from 'assert';

import { merge } from '../utils/index';

describe('Test utils', () => {

  describe('test merge function', () => {
    it('merge 1-depth object', () => {
      assert.deepEqual(merge({
        p1: 'alice',
        p2: 1
      }, {
        p1: 'bob',
        p3: true
      }), {
        p1: 'bob',
        p2: 1,
        p3: true
      });
    });

    it('merge to undefined src', () => {
      assert.throws(() => {
        merge(null, { prop: 'value' })
      }, TypeError);

      assert.throws(() => {
        merge(undefined, { prop: 'value' })
      }, TypeError);
    });
  });
});
