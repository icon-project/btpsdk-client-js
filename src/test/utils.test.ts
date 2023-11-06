import { merge } from '../utils/index';

describe('Test utils', () => {

  describe('test merge function', () => {
    it('merge 1-depth object', () => {

      expect(merge({
        p1: 'alice',
        p2: 1
      }, {
        p1: 'bob',
        p3: true
      })).toEqual({
        p1: 'bob',
        p2: 1,
        p3: true
      });
    });

    it('merge to undefined src', () => {
      expect(() => {
        merge(null, { prop: 'value' })
      }).toThrow(TypeError);
      expect(() => {
        merge(undefined, { prop: 'value' })
      }).toThrow(TypeError);
    });
  });
});
