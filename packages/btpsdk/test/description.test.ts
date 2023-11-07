import {
  read,
} from "./utils";

import {
  OpenAPIDocument,
} from "../src/service/description";

describe("service description tests", () => {
  it('load services', async () => {
    const services = [ 'dappsample', 'bmc', 'xcall' ];
    const oad = OpenAPIDocument.from(JSON.parse(read("api-document.json").toString()));
    expect(oad.services(services).length).toBe(services.length);
  });
});
