import { nodeResolve } from "@rollup/plugin-node-resolve";

const exportConditions = ["import", "default"];
const mainFields = ["browser", "module", "main"];

export default {
  input: "./lib.esm/index.js",
  output: {
    file: "./dist/btp.js",
    plugins:[nodeResolve({
      exportConditions,
      mainFields,
      moduleOnly: true,
      preferBuiltins: false
    })]
  },
  external: [ 'ws', 'cross-fetch', 'winston' ]
}
