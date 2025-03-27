import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { $ } from "bun"

// Determine version bump type
const args = process.argv.slice(2)
const versionArg = args[0] || "patch"

if (
  !["patch", "minor", "major", "prepatch", "preminor", "premajor", "prerelease"].includes(
    versionArg
  )
) {
  console.error(`Invalid version argument: ${versionArg}`)
  console.error("Valid options are: patch, minor, major, prepatch, preminor, premajor, prerelease")
  process.exit(1)
}

// Ensure clean git status
const gitStatus = await $`git status --porcelain`.text()
if (gitStatus.trim()) {
  console.error(
    "Working directory is not clean. Please commit or stash your changes before publishing."
  )
  process.exit(1)
}

// Run tests to ensure everything is working
console.log("Running tests...")
const testResult = await $`bun test`.quiet()
if (testResult.exitCode !== 0) {
  console.error("Tests failed. Please fix the tests before publishing.")
  process.exit(1)
}

// Build the package
console.log("Building package...")
const buildResult = await $`bun run build`.quiet()
if (buildResult.exitCode !== 0) {
  console.error("Build failed. Please fix the build issues before publishing.")
  process.exit(1)
}

// Bump version
console.log(`Bumping version (${versionArg})...`)
await $`npm version ${versionArg} --no-git-tag-version`

// Read the new version
const packageJson = JSON.parse(await readFile("package.json", "utf-8"))
const newVersion = packageJson.version
console.log(`New version: ${newVersion}`)

// Copy README.md and SETUP.md to dist
await $`cp README.md SETUP.md dist/`

// Create dist package.json
const distPackageJson = {
  name: packageJson.name,
  version: newVersion,
  description: packageJson.description,
  type: packageJson.type,
  main: "./index.js",
  module: "./index.js",
  types: "./index.d.ts",
  exports: {} as Record<string, any>,
  keywords: packageJson.keywords,
  author: packageJson.author,
  license: packageJson.license,
  peerDependencies: packageJson.peerDependencies,
  repository: packageJson.repository,
  bugs: packageJson.bugs,
  homepage: packageJson.homepage
}

// Copy exports and fix paths
if (packageJson.exports) {
  for (const [key, value] of Object.entries(packageJson.exports)) {
    distPackageJson.exports[key] = {}

    if (typeof value === "object" && value !== null) {
      for (const [format, path] of Object.entries(value)) {
        if (typeof path === "string" && path.startsWith("./dist/")) {
          ;(distPackageJson.exports[key] as Record<string, string>)[format] = path.replace(
            "./dist/",
            "./"
          )
        } else {
          ;(distPackageJson.exports[key] as Record<string, string>)[format] = path as string
        }
      }
    }
  }
}

await writeFile(join("dist", "package.json"), JSON.stringify(distPackageJson, null, 2))

// Commit the version bump
console.log("Committing version bump...")
await $`git add package.json`
await $`git commit -m "chore: bump version to ${newVersion}"`
await $`git tag v${newVersion}`

// Publish options message
console.log("\nVersion bump prepared!")
console.log(`Run one of the following commands to publish version ${newVersion}:`)
console.log("\nTo publish to npm:")
console.log("  cd dist && npm publish")
console.log("\nTo publish to npm (public):")
console.log("  cd dist && npm publish --access public")
console.log("\nTo push the git tag:")
console.log(`  git push origin v${newVersion}`)
console.log("\nTo push the version bump commit:")
console.log("  git push")
