import { cp, writeFile, mkdir, chmod } from "node:fs/promises"
import { join } from "node:path"
import { $ } from "bun"
import fs from "node:fs"

await $`rm -rf dist`

console.debug("Building ESM modules...")

await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  format: "esm",
  target: "node",
  sourcemap: "external",
  banner: "/** @jsxImportSource aisx */",
  minify: {
    whitespace: true,
    syntax: true
  }
})

await Bun.build({
  entrypoints: [
    "./src/jsx-runtime/index.ts",
    "./src/jsx-runtime/jsx-runtime.ts",
    "./src/jsx-runtime/types.ts",
    "./src/jsx-runtime/jsx-dev-runtime.ts"
  ],
  banner: "/** @jsxImportSource aisx */",
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
  banner: "/** @jsxImportSource aisx */",
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
  banner: "/** @jsxImportSource aisx */",
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
    "./src/jsx-runtime/types.ts",
    "./src/jsx-runtime/jsx-dev-runtime.ts"
  ],
  banner: "/** @jsxImportSource aisx */",
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
  banner: "/** @jsxImportSource aisx */",
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

await cp("./src/tsconfig/aisx.json", "./dist/tsconfig/aisx.json")
await cp("./src/tsconfig/aisx.json", "./dist/cjs/tsconfig/aisx.json")

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

if (fs.existsSync("./bin")) {
  console.debug("Building initialization script...")

  await mkdir("./dist/bin", { recursive: true })

  const result = await Bun.build({
    entrypoints: ["./bin/index.ts"],
    outdir: "./dist/bin",
    format: "esm",
    target: "node",
    sourcemap: "external",
    minify: false
  })

  if (result.success) {
    const initPath = join("dist", "bin", "index.js")

    let content = fs.readFileSync(initPath, "utf-8")

    content = content.replace("#!/usr/bin/env bun", "#!/usr/bin/env node")

    if (!content.startsWith("#!/usr/bin/env node")) {
      content = "#!/usr/bin/env node\n" + content
      fs.writeFileSync(initPath, content)
    }

    await chmod(initPath, 0o755)
    console.debug("Initialization script built successfully!")
  } else {
    console.error("Failed to build initialization script")
  }
}

console.debug("Build completed successfully!")
