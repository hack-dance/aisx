import { cp, readFile } from "node:fs/promises"
import { $ } from "bun"
async function confirm(message: string): Promise<boolean> {
  process.stdout.write(`${message} (y/N): `)

  for await (const line of console) {
    const input = line.trim().toLowerCase()
    return input === "y" || input === "yes"
  }

  return false
}

console.log("\n🚀 AISX Package Publisher 🚀")
console.log("============================\n")
console.log("This tool will help you publish a new version of aisx")
console.log("It will run tests, build the package, and prepare it for publishing\n")
console.log("💡 DRY RUN MODE is enabled by default (no actual publishing will occur)")
console.log("You will be prompted before any changes are made\n")

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

const currentPackageJson = JSON.parse(await readFile("package.json", "utf-8"))
console.log(`📦 Current package: ${currentPackageJson.name}@${currentPackageJson.version}`)

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

console.log("🔨 Building package...")
const buildResult = await $`bun run build`

if (buildResult.exitCode !== 0) {
  console.error("❌ Build failed. Please fix the build issues before publishing.")
  process.exit(1)
}

console.log("✅ Build successful!\n")

let newVersion = ""
try {
  const output = await $`npm --no-git-tag-version version ${versionArg} --dry-run`.text()
  newVersion = output.trim().replace(/^v/, "")
  console.log(`🏷️ New version will be: ${newVersion}`)
} catch (error) {
  console.error("❌ Failed to determine new version")
  process.exit(1)
}

if (!(await confirm(`Ready to prepare ${currentPackageJson.name}@${newVersion} for publishing?`))) {
  console.log("🛑 Publish aborted.")
  process.exit(0)
}

console.log(`\n📝 Bumping version to ${newVersion}...`)
await $`npm version ${versionArg} --no-git-tag-version`

const packageJson = JSON.parse(await readFile("package.json", "utf-8"))
newVersion = packageJson.version
console.log(`✅ Version bumped to ${newVersion}\n`)

console.log("📦 Copying documentation files...")
await cp("../README.md", "./README.md")
await cp("../SETUP.md", "./SETUP.md")
console.log("✅ Documentation files copied\n")

console.log("📦 PUBLISH PREVIEW:")
console.log(`Package: ${packageJson.name}@${newVersion}`)
console.log(`Repository: ${packageJson.repository?.url || "Not specified"}`)
console.log(`License: ${packageJson.license}`)
console.log("\n⚠️ NO CHANGES HAVE BEEN PUBLISHED YET ⚠️\n")

console.log("📋 NEXT STEPS:")
console.log(`To publish version ${newVersion} to npm, you need to:`)
console.log("\n1. Check that everything is correct in the package")
console.log("2. Run one of the following commands:")
console.log("\n   To publish to npm (default scope):")
console.log("   npm publish")
console.log("\n   To publish to npm (public scope):")
console.log("   npm publish --access public")
console.log("\n3. Push git changes:")
console.log(`   git push origin v${newVersion}  # Push the tag`)
console.log("   git push                       # Push the commit")

if (await confirm("\nWould you like to do a dry-run publish to verify everything?")) {
  console.log("\n🧪 Running npm publish --dry-run...")
  const publishResult = await $`npm publish --dry-run`
  console.log(publishResult.stdout.toString())

  if (publishResult.exitCode === 0) {
    console.log("✅ Dry-run publish successful!")
  } else {
    console.error("❌ Dry-run publish had issues. Please check the logs above.")
  }
}

console.log("\n🎉 Package preparation complete!")
console.log("Remember: No actual publishing has happened yet.")
