import 'mocha';
import assert from "assert";
import {
  read,
} from "./utils";
import {
  DefaultProvider,
} from "../provider/provider";

import {
  Service,
} from "../service/service";
import {
  OpenAPIDocument,
} from "../service/description";

describe("service description tests", async () => {
  it('load services', async () => {
    const services = [ 'dappsample', 'bmc', 'xcall' ];
    const oad = OpenAPIDocument.from(JSON.parse(read("api-document.json").toString()));
    assert.equal(oad.services(services).length, services.length);
  });
});
