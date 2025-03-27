import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { $ } from "bun"

/**
 * Interactive confirmation prompt
 */
async function confirm(message: string): Promise<boolean> {
  process.stdout.write(`${message} (y/N): `)

  for await (const line of console) {
    const input = line.trim().toLowerCase()
    return input === "y" || input === "yes"
  }

  return false
}

// Header display
console.log("\n🚀 AISX Package Publisher 🚀")
console.log("============================\n")
console.log("This tool will help you publish a new version of aisx")
console.log("It will run tests, build the package, and prepare it for publishing\n")
console.log("💡 DRY RUN MODE is enabled by default (no actual publishing will occur)")
console.log("You will be prompted before any changes are made\n")

// Determine version bump type
const args = process.argv.slice(2)
const versionArg = args[0] || "patch"

if (
  !["patch", "minor", "major", "prepatch", "preminor", "premajor", "prerelease"].includes(
    versionArg
  )
) {
  console.error(`❌ Invalid version argument: ${versionArg}`)
  console.error("Valid options are: patch, minor, major, prepatch, preminor, premajor, prerelease")
  process.exit(1)
}

console.log(`📋 Version bump type: ${versionArg}`)

// Check current package info
const currentPackageJson = JSON.parse(await readFile("package.json", "utf-8"))
console.log(`📦 Current package: ${currentPackageJson.name}@${currentPackageJson.version}`)

// Ensure clean git status
const gitStatus = await $`git status --porcelain`.text()
if (gitStatus.trim()) {
  console.error(
    "❌ Working directory is not clean. Please commit or stash your changes before publishing."
  )

  console.log("\nUncommitted changes:")
  console.log(await $`git status`.text())

  if (!(await confirm("Do you want to continue anyway? (not recommended)"))) {
    console.log("🛑 Publish aborted.")
    process.exit(1)
  }

  console.log("⚠️ Continuing with uncommitted changes...\n")
}

// Run tests to ensure everything is working
if (await confirm("Run tests before publishing?")) {
  console.log("\n🧪 Running tests...")
  const testResult = await $`bun test`

  if (testResult.exitCode !== 0) {
    console.error("❌ Tests failed. Please fix the tests before publishing.")

    if (!(await confirm("Continue despite test failures?"))) {
      console.log("🛑 Publish aborted.")
      process.exit(1)
    }

    console.log("⚠️ Continuing despite test failures...\n")
  } else {
    console.log("✅ Tests passed!\n")
  }
} else {
  console.log("⚠️ Skipping tests...\n")
}

// Build the package
console.log("🔨 Building package...")
const buildResult = await $`bun run build`

if (buildResult.exitCode !== 0) {
  console.error("❌ Build failed. Please fix the build issues before publishing.")
  process.exit(1)
}

console.log("✅ Build successful!\n")

// Preview version bump
let newVersion = ""
try {
  // Get what the new version would be without actually bumping
  const output = await $`npm --no-git-tag-version version ${versionArg} --dry-run`.text()
  newVersion = output.trim().replace(/^v/, "")
  console.log(`🏷️ New version will be: ${newVersion}`)
} catch (error) {
  console.error("❌ Failed to determine new version")
  process.exit(1)
}

// Confirmation before proceeding
if (!(await confirm(`Ready to prepare ${currentPackageJson.name}@${newVersion} for publishing?`))) {
  console.log("🛑 Publish aborted.")
  process.exit(0)
}

// Bump version
console.log(`\n📝 Bumping version to ${newVersion}...`)
await $`npm version ${versionArg} --no-git-tag-version`

// Read the new version from package.json to ensure accuracy
const packageJson = JSON.parse(await readFile("package.json", "utf-8"))
newVersion = packageJson.version
console.log(`✅ Version bumped to ${newVersion}\n`)

console.log("📋 Copying documentation files...")
try {
  const copyFile = async (file: string) => {
    try {
      await $`cp ${file} dist/`
    } catch {
      console.log(`⚠️ Warning: Could not find ${file}`)

      throw new Error(`Could not find ${file}`)
    }
  }

  await Promise.all([copyFile("../README.md"), copyFile("../SETUP.md"), copyFile("../LICENSE")])
  console.log("✅ Documentation files copied\n")
} catch (error) {
  console.log("⚠️ Warning: Some documentation files could not be copied\n")
}

// Create dist package.json
console.log("📦 Creating distribution package.json...")
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
  homepage: packageJson.homepage,
  engines: packageJson.engines
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
console.log("✅ Distribution package.json created\n")

// Git operations
console.log("🔄 Git operations:")
if (await confirm("Commit version bump to git?")) {
  console.log("📝 Committing version bump...")
  await $`git add package.json`
  await $`git commit -m "chore: bump version to ${newVersion}"`
  console.log("✅ Version bump committed\n")

  if (await confirm("Create git tag for this version?")) {
    console.log(`🏷️ Creating git tag v${newVersion}...`)
    await $`git tag v${newVersion}`
    console.log("✅ Git tag created\n")
  }
} else {
  console.log("⚠️ Skipping git commit\n")
}

// Publish preview
console.log("📦 PUBLISH PREVIEW:")
console.log(`Package: ${packageJson.name}@${newVersion}`)
console.log(`Repository: ${packageJson.repository?.url || "Not specified"}`)
console.log(`License: ${packageJson.license}`)
console.log("\n⚠️ NO CHANGES HAVE BEEN PUBLISHED YET ⚠️\n")

// Final options for actual publishing
console.log("📋 NEXT STEPS:")
console.log(`To publish version ${newVersion} to npm, you need to:`)
console.log("\n1. Check the dist/ directory to verify everything is correct")
console.log("2. Run one of the following commands:")
console.log("\n   To publish to npm (default scope):")
console.log("   cd dist && npm publish")
console.log("\n   To publish to npm (public scope):")
console.log("   cd dist && npm publish --access public")
console.log("\n3. Push git changes:")
console.log(`   git push origin v${newVersion}  # Push the tag`)
console.log("   git push                       # Push the commit")

// Dry-run publish
if (await confirm("\nWould you like to do a dry-run publish to verify everything?")) {
  console.log("\n🧪 Running npm publish --dry-run...")
  const publishResult = await $`cd dist && npm publish --dry-run`
  console.log(publishResult.stdout.toString())

  if (publishResult.exitCode === 0) {
    console.log("✅ Dry-run publish successful!")
  } else {
    console.error("❌ Dry-run publish had issues. Please check the logs above.")
  }
}

console.log("\n🎉 Package preparation complete!")
console.log("Remember: No actual publishing has happened yet.")
