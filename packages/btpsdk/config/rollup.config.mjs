import { nodeResolve } from "@rollup/plugin-node-resolve";

const exportConditions = ["import", "default"];
const mainFields = ["browser", "module", "main"];

export default {
  input: "./lib.esm/index.js",
  output: {
    file: "./dist/btp.js",
    format: "esm",
    sourcemap: true
  },
  treeshake: true,
  plugins:[nodeResolve({
    exportConditions,
    mainFields,
    moduleOnly: true,
    preferBuiltins: false
  })],
  external: [ 'ws', 'cross-fetch' ]
}
