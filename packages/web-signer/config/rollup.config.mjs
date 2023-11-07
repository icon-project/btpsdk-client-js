import { nodeResolve } = from "@rollup/plugin-node-resolve";

export default {

  const exportConditions = ["import", "default"];
  const mainFields = ["browser", "module", "main"];

  return {
    input: "./lib.esm/index.js",
    output: {
      file: "../dist/btp.js"
      plugins:[nodeResolve({
        exportConditions,
        mainFields,
        moduleOnly: true,
        preferBuiltins: false
      })]
    }
  }
}
