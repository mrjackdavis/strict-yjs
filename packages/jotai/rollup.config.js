import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json";

export default {
  input: "src/index.ts",
  output: [
    {
      dir: "./",
      entryFileNames: pkg.main.substring(2),
      format: "cjs",
    },
    {
      dir: "./",
      entryFileNames: pkg.module.substring(2),
      format: "es",
    },
  ],
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
      module: "esnext",
    }),
  ],
  external: [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
  ],
};
