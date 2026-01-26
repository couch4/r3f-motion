import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import dts from "rollup-plugin-dts";
import pkg from "./package.json" with { type: "json" };

const config = {
  input: "lib/index.js",
};

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  "motion/react",
  "framer-motion",
  "motion-dom",
  "motion-utils",
  "react/jsx-runtime",
  "tslib",
];

const cjs = Object.assign({}, config, {
  input: ["lib/index.js"],
  output: {
    entryFileNames: `[name].js`,
    dir: "dist/cjs",
    format: "cjs",
    exports: "named",
    banner: '"use client";',
  },
  plugins: [resolve()],
  external,
});

const es = Object.assign({}, config, {
  input: ["lib/index.js"],
  output: {
    entryFileNames: "[name].mjs",
    format: "es",
    exports: "named",
    preserveModules: true,
    dir: "dist/es",
    banner: '"use client";',
  },
  plugins: [commonjs(), resolve()],
  external,
});

const types = {
  input: "types/index.d.ts",
  output: {
    format: "es",
    file: "dist/index.d.ts",
  },
  plugins: [dts()],
};

// eslint-disable-next-line import/no-default-export
export default [cjs, es, types];
