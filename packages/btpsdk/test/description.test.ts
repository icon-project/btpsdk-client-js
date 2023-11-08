import {
  read,
} from "./utils";

import {
  BTPError,
  ERR_UNKNOWN_SERVICE,
} from '../src/error/index';

import {
  OpenAPIDocument,
} from "../src/service/description";


describe("description", () => {
  describe('tests with valid api document', () => {
    const names = ['dappsample', 'bmc', 'xcall'];
    let doc: OpenAPIDocument;

    beforeAll(async () => {
      doc = OpenAPIDocument.from(JSON.parse(read("api-document.json").toString()));
    });

    it('parse service descriptions', async () => {
      const services = doc.services(names);
      expect(services.length).toBe(names.length);
    });

    it('load service', () => {
      const desc = doc.service('bmc');
      expect(desc.name).toBe('bmc');
    });

    it('load unknown service description', () => {
      expect(() => doc.service('unknown'))
      .toThrow(new BTPError(ERR_UNKNOWN_SERVICE, { service: 'unknown' }))
    });
  });
});
