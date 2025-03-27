import { cp, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { $ } from "bun"

await $`rm -rf dist`

console.debug("Building ESM modules...")

await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  format: "esm",
  target: "node",
  sourcemap: "external",
  banner: "/** @jsxImportSource aiml */",
  minify: {
    whitespace: true,
    syntax: true
  }
})

await Bun.build({
  entrypoints: [
    "./src/jsx-runtime/index.ts",
    "./src/jsx-runtime/jsx-runtime.ts",
    "./src/jsx-runtime/jsx-dev-runtime.ts"
  ],
  banner: "/** @jsxImportSource aiml */",
  outdir: "./dist/jsx-runtime",
  format: "esm",
  target: "node",
  sourcemap: "external",
  minify: {
    whitespace: true,
    syntax: true
  }
})

await Bun.build({
  entrypoints: ["./src/jsx-dev-runtime/index.ts"],
  outdir: "./dist/jsx-dev-runtime",
  banner: "/** @jsxImportSource aiml */",
  format: "esm",
  target: "node",
  sourcemap: "external",
  minify: {
    whitespace: true,
    syntax: true
  }
})

console.debug("Building CommonJS modules...")

await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist/cjs",
  banner: "/** @jsxImportSource aiml */",
  format: "cjs",
  target: "node",
  sourcemap: "external",
  minify: {
    whitespace: true,
    syntax: true
  }
})

await Bun.build({
  entrypoints: [
    "./src/jsx-runtime/index.ts",
    "./src/jsx-runtime/jsx-runtime.ts",
    "./src/jsx-runtime/jsx-dev-runtime.ts"
  ],
  banner: "/** @jsxImportSource aiml */",
  outdir: "./dist/cjs/jsx-runtime",
  format: "cjs",
  target: "node",
  sourcemap: "external",
  minify: {
    whitespace: true,
    syntax: true
  }
})

await Bun.build({
  entrypoints: ["./src/jsx-dev-runtime/index.ts"],
  outdir: "./dist/cjs/jsx-dev-runtime",
  banner: "/** @jsxImportSource aiml */",
  format: "cjs",
  target: "node",
  sourcemap: "external",
  minify: {
    whitespace: true,
    syntax: true
  }
})

console.debug("Copying TypeScript configuration...")

await $`mkdir -p ./dist/tsconfig ./dist/cjs/tsconfig`

await cp("./src/tsconfig/aiml.json", "./dist/tsconfig/aiml.json")
await cp("./src/tsconfig/aiml.json", "./dist/cjs/tsconfig/aiml.json")

console.debug("Generating TypeScript declarations...")
await $`tsc --emitDeclarationOnly --declaration --outDir dist`

console.debug("Creating package.json for CJS...")
await writeFile(
  join("dist", "cjs", "package.json"),
  JSON.stringify(
    {
      type: "commonjs"
    },
    null,
    2
  )
)

console.debug("Copying global.d.ts to dist...")
await cp("./src/global.d.ts", "./dist/global.d.ts")

console.debug("Build completed successfully!")
