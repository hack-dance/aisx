#!/usr/bin/env node
import { execSync } from "child_process"
import { setTimeout } from "node:timers/promises"
import fs from "fs"
import path from "path"
import {
  intro,
  outro,
  text,
  confirm,
  select,
  multiselect,
  spinner,
  isCancel,
  cancel,
  log,
  note
} from "@clack/prompts"
import colors from "picocolors"

const fixTerminalCompatibility = () => {
  process.env.FORCE_COLOR = "1"

  if (!process.stdout.isTTY) {
    process.stdout.isTTY = true
  }

  if (!process.stdout.columns) {
    try {
      const cols = parseInt(process.env.COLUMNS || process.env.TERM_COLS || "80", 10)
      process.stdout.columns = cols > 0 ? cols : 80
    } catch {
      process.stdout.columns = 80
    }
  }

  if (!process.stdout.rows) {
    try {
      const rows = parseInt(process.env.ROWS || process.env.TERM_ROWS || "24", 10)
      process.stdout.rows = rows > 0 ? rows : 24
    } catch {
      process.stdout.rows = 24
    }
  }
}

// bun has some issues that arent dealt with
// in clack so we are just patching it here for now
if (process.argv[0]?.includes("bun")) {
  fixTerminalCompatibility()
}
import { ExampleTemplate, ExampleTest, TypeScriptDefinition } from "./templates.aisx"

const args = process.argv.slice(2)
const targetPath = args[0] || process.cwd()

const detectPackageManager = (basePath: string): "npm" | "yarn" | "pnpm" | "bun" => {
  try {
    if (fs.existsSync(path.join(basePath, "bun.lockb"))) return "bun"
    if (fs.existsSync(path.join(basePath, "pnpm-lock.yaml"))) return "pnpm"
    if (fs.existsSync(path.join(basePath, "yarn.lock"))) return "yarn"
    return "npm" // Default if no lock file found
  } catch (error) {
    return "npm" // Default to npm on error
  }
}

const isTypeScriptProject = (basePath: string): boolean => {
  return (
    fs.existsSync(path.join(basePath, "tsconfig.json")) ||
    fs.existsSync(path.join(basePath, "node_modules/typescript")) ||
    Boolean(findFiles(basePath, ".ts").length)
  )
}

const detectMonorepo = (
  basePath: string
): { isMonorepo: boolean; type: string | null; workspaces: string[] } => {
  try {
    // Read package.json
    const packageJsonPath = path.join(basePath, "package.json")
    if (!fs.existsSync(packageJsonPath)) {
      return { isMonorepo: false, type: null, workspaces: [] }
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))

    // Check for workspaces
    if (packageJson.workspaces) {
      return {
        isMonorepo: true,
        type: "workspaces",
        workspaces:
          Array.isArray(packageJson.workspaces) ?
            packageJson.workspaces
          : packageJson.workspaces.packages || []
      }
    }

    // Check for Turborepo
    if (fs.existsSync(path.join(basePath, "turbo.json"))) {
      return { isMonorepo: true, type: "turborepo", workspaces: [] }
    }

    return { isMonorepo: false, type: null, workspaces: [] }
  } catch (error) {
    return { isMonorepo: false, type: null, workspaces: [] }
  }
}

const detectBuildSystem = (basePath: string): string | null => {
  try {
    // Read package.json for scripts
    const packageJsonPath = path.join(basePath, "package.json")
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))

      if (packageJson.dependencies || packageJson.devDependencies) {
        const allDeps = {
          ...(packageJson.dependencies || {}),
          ...(packageJson.devDependencies || {})
        }

        if (allDeps.vite) return "vite"
        if (allDeps.webpack) return "webpack"
        if (allDeps["@rollup/plugin-node-resolve"] || allDeps.rollup) return "rollup"
        if (allDeps.esbuild) return "esbuild"
        if (allDeps["@swc/core"]) return "swc"
      }

      // Check scripts
      if (packageJson.scripts) {
        const scripts = Object.values(packageJson.scripts).join(" ")
        if (scripts.includes("vite")) return "vite"
        if (scripts.includes("webpack")) return "webpack"
        if (scripts.includes("rollup")) return "rollup"
        if (scripts.includes("esbuild")) return "esbuild"
        if (scripts.includes("swc")) return "swc"
      }
    }

    // Check for config files
    if (
      fs.existsSync(path.join(basePath, "vite.config.js")) ||
      fs.existsSync(path.join(basePath, "vite.config.ts"))
    )
      return "vite"
    if (
      fs.existsSync(path.join(basePath, "webpack.config.js")) ||
      fs.existsSync(path.join(basePath, "webpack.config.ts"))
    )
      return "webpack"
    if (
      fs.existsSync(path.join(basePath, "rollup.config.js")) ||
      fs.existsSync(path.join(basePath, "rollup.config.ts"))
    )
      return "rollup"
    if (
      fs.existsSync(path.join(basePath, "esbuild.config.js")) ||
      fs.existsSync(path.join(basePath, "esbuild.config.ts"))
    )
      return "esbuild"
    if (fs.existsSync(path.join(basePath, ".swcrc"))) return "swc"

    return null
  } catch (error) {
    return null
  }
}

const findFiles = (directory: string, extension: string): string[] => {
  let results: string[] = []

  try {
    const files = fs.readdirSync(directory)

    for (const file of files) {
      const filePath = path.join(directory, file)
      const stat = fs.statSync(filePath)

      if (stat.isDirectory() && !file.startsWith("node_modules") && !file.startsWith(".git")) {
        results = results.concat(findFiles(filePath, extension))
      } else if (file.endsWith(extension)) {
        results.push(filePath)
      }
    }
  } catch (error) {
    console.error(`Error searching directory ${directory}:`, error)
  }

  return results
}

const hasReactJsx = async (basePath: string): Promise<boolean> => {
  const tsxFiles = findFiles(basePath, ".tsx")
  const jsxFiles = findFiles(basePath, ".jsx")

  if (tsxFiles.length === 0 && jsxFiles.length === 0) return false

  try {
    const packageJsonPath = path.join(basePath, "package.json")
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
      const allDeps = {
        ...(packageJson.dependencies || {}),
        ...(packageJson.devDependencies || {})
      }

      return "react" in allDeps
    }
  } catch (error) {
    console.error("Error checking for React dependency:", error)
  }

  return false
}

const modifyTsConfig = (targetPath: string) => {
  try {
    let tsconfig: any = {}

    if (fs.existsSync(targetPath)) {
      tsconfig = JSON.parse(fs.readFileSync(targetPath, "utf-8"))
    } else {
      // Create minimal tsconfig if none exists
      tsconfig = {
        compilerOptions: {
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "node",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true
        },
        include: ["**/*.ts", "**/*.tsx"]
      }
    }

    // Add AISX specific configuration
    tsconfig.compilerOptions = {
      ...tsconfig.compilerOptions,
      jsx: "preserve",
      jsxFactory: "jsx",
      jsxFragmentFactory: "Fragment",
      jsxImportSource: "aisx"
    }

    // Add AISX file patterns to include
    if (!tsconfig.include) {
      tsconfig.include = []
    }

    const aisxPatterns = ["**/*.aisx.tsx", "**/*.aisx.test.tsx", "**/*.aisx.ts"]

    for (const pattern of aisxPatterns) {
      if (!tsconfig.include.includes(pattern)) {
        tsconfig.include.push(pattern)
      }
    }

    fs.writeFileSync(targetPath, JSON.stringify(tsconfig, null, 2))
    log.success(`Updated TypeScript configuration in ${targetPath}`)
  } catch (error) {
    log.error(`Error modifying tsconfig.json: ${error}`)
  }
}

// Interface for project settings
interface ProjectSettings {
  packageManager: "npm" | "yarn" | "pnpm" | "bun"
  isTypescript: boolean
  monorepo: {
    isMonorepo: boolean
    type: string | null
    workspaces: string[]
  }
  buildSystem: string | null
  hasReact: boolean
  targetDirectory: string
}

async function init() {
  console.log()

  intro(colors.inverse(" AISX Initialization "))

  const s = spinner()
  s.start(`Checking directory ${colors.yellow(targetPath)}`)

  if (!fs.existsSync(targetPath)) {
    s.stop(`Directory not found: ${colors.red(targetPath)}`)
    cancel(`The directory ${colors.red(targetPath)} does not exist.`)
    process.exit(1)
  }
  await setTimeout(1000)
  s.stop(`Found directory ${colors.green(targetPath)}`)

  note(`Analyzing project structure...`, "Scanning")

  s.start("Detecting package manager")
  const packageManager = detectPackageManager(targetPath)
  await setTimeout(1000)

  s.stop(`Detected package manager: ${colors.yellow(packageManager)}`)

  s.start("Checking for TypeScript")
  const isTypescript = isTypeScriptProject(targetPath)
  await setTimeout(1000)

  s.stop(`TypeScript: ${colors.yellow(isTypescript ? "Yes" : "No")}`)

  s.start("Analyzing project structure")
  const monorepo = detectMonorepo(targetPath)
  await setTimeout(1000)

  s.stop(`Monorepo: ${colors.yellow(monorepo.isMonorepo ? `Yes (${monorepo.type})` : "No")}`)

  s.start("Identifying build system")
  const buildSystem = detectBuildSystem(targetPath)
  await setTimeout(1000)

  s.stop(`Build system: ${colors.yellow(buildSystem || "None detected")}`)

  s.start("Checking for React")
  const hasReact = await hasReactJsx(targetPath)
  await setTimeout(1000)

  s.stop(`React/JSX: ${colors.yellow(hasReact ? "Yes" : "No")}`)

  const settings: ProjectSettings = {
    packageManager,
    isTypescript,
    monorepo,
    buildSystem,
    hasReact,
    targetDirectory: targetPath
  }

  note(`Here's what we found in your project:`, "Project Analysis")

  log.step(`Package manager: ${colors.yellow(settings.packageManager)}`)
  log.step(`TypeScript: ${colors.yellow(settings.isTypescript ? "Yes" : "No")}`)
  log.step(
    `Monorepo: ${colors.yellow(settings.monorepo.isMonorepo ? `Yes (${settings.monorepo.type})` : "No")}`
  )
  log.step(`Build system: ${colors.yellow(settings.buildSystem || "None detected")}`)
  log.step(`React/JSX: ${colors.yellow(settings.hasReact ? "Yes" : "No")}`)
  log.step(`Target directory: ${colors.yellow(settings.targetDirectory)}`)

  const confirmSettings = await confirm({
    message: "Are these settings correct?"
  })

  if (isCancel(confirmSettings)) {
    cancel("Operation cancelled")
    return process.exit(0)
  }

  if (!confirmSettings) {
    note("Let's adjust the settings", "Customization")

    const settingsToEdit = await multiselect({
      message: "Which settings would you like to adjust?",
      options: [
        { value: "packageManager", label: "Package Manager" },
        { value: "isTypescript", label: "TypeScript Support" },
        { value: "targetDirectory", label: "Installation Directory" }
      ]
    })

    if (isCancel(settingsToEdit)) {
      cancel("Operation cancelled")
      return process.exit(0)
    }

    for (const setting of settingsToEdit) {
      if (setting === "packageManager") {
        const newPackageManager = await select({
          message: "Select package manager:",
          options: [
            { value: "npm", label: "npm" },
            { value: "yarn", label: "Yarn" },
            { value: "pnpm", label: "pnpm" },
            { value: "bun", label: "Bun" }
          ]
        })

        if (isCancel(newPackageManager)) {
          cancel("Operation cancelled")
          return process.exit(0)
        }

        settings.packageManager = newPackageManager as "npm" | "yarn" | "pnpm" | "bun"
      } else if (setting === "isTypescript") {
        const newTypeScriptSetting = await confirm({
          message: "Use TypeScript?"
        })

        if (isCancel(newTypeScriptSetting)) {
          cancel("Operation cancelled")
          return process.exit(0)
        }

        settings.isTypescript = newTypeScriptSetting
      } else if (setting === "targetDirectory") {
        const newDirectory = await text({
          message: "Enter installation directory path:",
          placeholder: targetPath
        })

        if (isCancel(newDirectory)) {
          cancel("Operation cancelled")
          return process.exit(0)
        }

        // Validate the new directory
        const dirPath = newDirectory.toString()
        if (!fs.existsSync(dirPath)) {
          const createDir = await confirm({
            message: `Directory ${colors.yellow(dirPath)} doesn't exist. Create it?`
          })

          if (isCancel(createDir)) {
            cancel("Operation cancelled")
            return process.exit(0)
          }

          if (createDir) {
            try {
              fs.mkdirSync(dirPath, { recursive: true })
              log.success(`Created directory: ${colors.green(dirPath)}`)
            } catch (error) {
              log.error(`Failed to create directory: ${error}`)
              cancel("Operation cancelled due to error")
              return process.exit(1)
            }
          } else {
            cancel("Operation cancelled: directory doesn't exist")
            return process.exit(1)
          }
        }

        settings.targetDirectory = dirPath
      }
    }

    // Show updated settings
    note("Updated settings:", "Review")
    log.step(`Package manager: ${colors.yellow(settings.packageManager)}`)
    log.step(`TypeScript: ${colors.yellow(settings.isTypescript ? "Yes" : "No")}`)
    log.step(
      `Monorepo: ${colors.yellow(settings.monorepo.isMonorepo ? `Yes (${settings.monorepo.type})` : "No")}`
    )
    log.step(`Build system: ${colors.yellow(settings.buildSystem || "None detected")}`)
    log.step(`React/JSX: ${colors.yellow(settings.hasReact ? "Yes" : "No")}`)
    log.step(`Target directory: ${colors.yellow(settings.targetDirectory)}`)
  }

  // Determine installation path and strategy based on settings
  let installPath = settings.targetDirectory
  let installStrategy = "standard"

  if (settings.monorepo.isMonorepo) {
    log.info(colors.blue("Monorepo detected!"))

    if (settings.hasReact) {
      log.warn("React JSX detected. AISX uses its own JSX runtime which may conflict with React.")
      log.info("You can either:")
      log.step("1. Create a standalone AISX package in your monorepo")
      log.step("2. Manually integrate AISX with careful JSX pragma management")

      const choice = await confirm({
        message: "Would you like to create a standalone AISX package?"
      })

      if (isCancel(choice)) {
        cancel("Operation cancelled")
        return process.exit(0)
      }

      if (choice) {
        installStrategy = "standalone"
        const packageName = await text({
          message: "Enter the name for your AISX package:",
          placeholder: "aisx-package"
        })

        if (isCancel(packageName)) {
          cancel("Operation cancelled")
          return process.exit(0)
        }

        // Set the installPath to the new package directory
        installPath = path.join(settings.targetDirectory, packageName.toString())

        // Confirm before creating
        const confirmCreate = await confirm({
          message: `Create new package at ${colors.yellow(installPath)}?`
        })

        if (isCancel(confirmCreate) || !confirmCreate) {
          cancel("Operation cancelled")
          return process.exit(0)
        }
      } else {
        log.info(colors.yellow("\nTo manually integrate AISX, follow these steps:"))
        log.step("1. Install AISX: `npm install aisx`")
        log.step(
          "2. Use the JSX pragma comment `/** @jsxImportSource aisx */` at the top of each AISX template file"
        )
        log.step("3. Use the `.aisx.tsx` extension for your template files")
        outro("Manual integration selected")
        return
      }
    } else {
      // No React, offer workspaces choice or new standalone package
      const options = [{ value: "new", label: "Create a new AISX package" }]

      if (settings.monorepo.workspaces && settings.monorepo.workspaces.length > 0) {
        options.unshift({ value: "existing", label: "Add AISX to an existing workspace" })
      }

      const choice = await select({
        message: "Select an option:",
        options
      })

      if (isCancel(choice)) {
        cancel("Operation cancelled")
        return process.exit(0)
      }

      if (
        choice === "existing" &&
        settings.monorepo.workspaces &&
        settings.monorepo.workspaces.length > 0
      ) {
        const workspaceOptions = settings.monorepo.workspaces.map(workspace => ({
          value: workspace,
          label: workspace
        }))

        const selectedWorkspace = await select({
          message: "Select workspace:",
          options: workspaceOptions
        })

        if (isCancel(selectedWorkspace)) {
          cancel("Operation cancelled")
          return process.exit(0)
        }

        // Replace glob patterns with first matching directory
        const resolvedPath =
          typeof selectedWorkspace === "string" && selectedWorkspace.includes("*") ?
            findMatchingWorkspaces(selectedWorkspace)[0]
          : String(selectedWorkspace)

        if (resolvedPath) {
          installPath = path.join(settings.targetDirectory, resolvedPath)

          // Confirm before proceeding
          const confirmWorkspace = await confirm({
            message: `Install AISX in workspace at ${colors.yellow(installPath)}?`
          })

          if (isCancel(confirmWorkspace) || !confirmWorkspace) {
            cancel("Operation cancelled")
            return process.exit(0)
          }
        } else {
          log.error("Could not resolve workspace path")
          return process.exit(1)
        }
      } else {
        installStrategy = "standalone"
        const packageName = await text({
          message: "Enter the name for your new AISX package:",
          placeholder: "aisx-package"
        })

        if (isCancel(packageName)) {
          cancel("Operation cancelled")
          return process.exit(0)
        }

        // Set the installPath to the new package directory
        installPath = path.join(settings.targetDirectory, packageName.toString())

        // Confirm before creating
        const confirmCreate = await confirm({
          message: `Create new package at ${colors.yellow(installPath)}?`
        })

        if (isCancel(confirmCreate) || !confirmCreate) {
          cancel("Operation cancelled")
          return process.exit(0)
        }
      }
    }
  } else {
    // Regular project
    if (settings.hasReact) {
      log.warn("React JSX detected. AISX uses its own JSX runtime which may conflict with React.")
      log.info(
        "It's recommended to keep AISX templates in a separate directory with the .aisx.tsx extension"
      )

      const proceed = await confirm({
        message: "Proceed with installation?"
      })

      if (isCancel(proceed) || !proceed) {
        cancel("Operation cancelled")
        return process.exit(0)
      }
    }

    // Confirm installation in current directory
    const confirmInstall = await confirm({
      message: `Install AISX in ${colors.yellow(installPath)}?`
    })

    if (isCancel(confirmInstall) || !confirmInstall) {
      cancel("Operation cancelled")
      return process.exit(0)
    }
  }

  // Execute the installation based on the strategy
  if (installStrategy === "standalone") {
    await createStandalonePackage(
      path.basename(installPath),
      settings.packageManager,
      settings.isTypescript,
      path.dirname(installPath)
    )
  } else {
    await integrateAisxIntoProject(installPath, settings.packageManager, settings.isTypescript)
  }

  outro("AISX setup completed successfully!")
}

function findMatchingWorkspaces(pattern: string): string[] {
  if (pattern.includes("*")) {
    const patternBase = pattern.split("*")[0]
    const results: string[] = []

    try {
      if (fs.existsSync(patternBase)) {
        const items = fs.readdirSync(patternBase)

        for (const item of items) {
          const fullPath = path.join(patternBase, item)
          if (fs.statSync(fullPath).isDirectory()) {
            results.push(fullPath)
          }
        }
      }
    } catch (error) {
      console.error("Error matching workspaces:", error)
    }

    return results
  }

  return [pattern]
}

async function createStandalonePackage(
  packageName: string,
  packageManager: string,
  isTypescript: boolean,
  parentDir: string = process.cwd()
) {
  const safePackageName = packageName.replace(/[^a-z0-9-]/gi, "-").toLowerCase()
  const packageDir = path.join(parentDir, safePackageName)

  log.info(`Creating new package: ${colors.green(safePackageName)}`)

  // Confirm directory creation
  if (fs.existsSync(packageDir)) {
    const overwrite = await confirm({
      message: `Directory ${colors.yellow(packageDir)} already exists. Proceed anyway?`
    })

    if (isCancel(overwrite) || !overwrite) {
      cancel("Operation cancelled")
      return process.exit(0)
    }
  } else {
    fs.mkdirSync(packageDir, { recursive: true })
  }

  fs.mkdirSync(path.join(packageDir, "src"), { recursive: true })

  const packageJson = {
    name: safePackageName,
    version: "0.1.0",
    description: "AISX templates for structured AI prompts",
    main: "src/index.ts",
    type: "module",
    scripts: {
      test: "bun test"
    },
    dependencies: {
      aisx: "latest"
    },
    devDependencies: isTypescript ? { typescript: "^5.0.0" } : {}
  }

  // Confirm file creation
  const confirmFiles = await confirm({
    message: "Create package.json and example files?"
  })

  if (isCancel(confirmFiles) || !confirmFiles) {
    cancel("Operation cancelled")
    return process.exit(0)
  }

  // Create files with spinners for visual feedback
  const s = spinner()

  s.start("Creating package.json")
  fs.writeFileSync(path.join(packageDir, "package.json"), JSON.stringify(packageJson, null, 2))
  s.stop("Created package.json")

  if (isTypescript) {
    s.start("Setting up TypeScript")
    modifyTsConfig(path.join(packageDir, "tsconfig.json"))
    fs.writeFileSync(path.join(packageDir, "aisx.d.ts"), TypeScriptDefinition)
    s.stop("TypeScript configured")
  }

  s.start("Creating example files")
  fs.writeFileSync(path.join(packageDir, "src", "example.aisx.tsx"), ExampleTemplate)
  fs.writeFileSync(path.join(packageDir, "src", "example.aisx.test.tsx"), ExampleTest)
  s.stop("Created example templates")

  // Confirm dependency installation
  const installDeps = await confirm({
    message: "Install dependencies now?"
  })

  if (isCancel(installDeps)) {
    cancel("Operation cancelled")
    return process.exit(0)
  }

  if (installDeps) {
    s.start("Installing dependencies")

    try {
      let installCmd = ""
      switch (packageManager) {
        case "npm":
          installCmd = "npm install"
          break
        case "yarn":
          installCmd = "yarn"
          break
        case "pnpm":
          installCmd = "pnpm install"
          break
        case "bun":
          installCmd = "bun install"
          break
      }

      execSync(installCmd, { cwd: packageDir, stdio: "ignore" })
      s.stop("Dependencies installed successfully")
    } catch (error) {
      s.stop(`Error installing dependencies: ${error}`)
      log.error(`Failed to install dependencies: ${error}`)
    }
  }

  log.success(`Successfully created AISX package in ${packageDir}`)
  log.info(`To get started:`)
  log.step(`cd ${packageDir}`)
  log.step(
    `${packageManager === "yarn" ? "yarn test" : `${packageManager} ${packageManager === "npm" ? "run " : ""}test`}`
  )
}

async function integrateAisxIntoProject(
  projectPath: string,
  packageManager: string,
  isTypescript: boolean
) {
  log.info(`Integrating AISX into project at ${colors.green(projectPath)}...`)

  const aisxDir = path.join(projectPath, "aisx")

  // Confirm directory creation
  const confirmDir = await confirm({
    message: `Create AISX directory at ${colors.yellow(aisxDir)}?`
  })

  if (isCancel(confirmDir) || !confirmDir) {
    cancel("Operation cancelled")
    return process.exit(0)
  }

  if (!fs.existsSync(aisxDir)) {
    fs.mkdirSync(aisxDir, { recursive: true })
  }

  // Confirm dependency installation
  const installDeps = await confirm({
    message: "Install AISX dependency?"
  })

  if (isCancel(installDeps)) {
    cancel("Operation cancelled")
    return process.exit(0)
  }

  if (installDeps) {
    const s = spinner()
    s.start("Installing AISX")

    try {
      let installCmd = ""
      switch (packageManager) {
        case "npm":
          installCmd = "npm install aisx"
          break
        case "yarn":
          installCmd = "yarn add aisx"
          break
        case "pnpm":
          installCmd = "pnpm add aisx"
          break
        case "bun":
          installCmd = "bun add aisx"
          break
      }

      execSync(installCmd, { cwd: projectPath, stdio: "ignore" })
      s.stop("AISX installed successfully")
    } catch (error) {
      s.stop(`Error installing AISX: ${error}`)
      const proceed = await confirm({
        message: "Failed to install AISX. Continue anyway?"
      })

      if (isCancel(proceed) || !proceed) {
        cancel("Operation cancelled")
        return process.exit(0)
      }
    }
  }

  // Confirm file creation
  const confirmFiles = await confirm({
    message: "Create example files and TypeScript config?"
  })

  if (isCancel(confirmFiles) || !confirmFiles) {
    cancel("Operation cancelled")
    return process.exit(0)
  }

  const s = spinner()

  if (isTypescript) {
    s.start("Setting up TypeScript")
    fs.writeFileSync(path.join(projectPath, "aisx.d.ts"), TypeScriptDefinition)
    modifyTsConfig(path.join(projectPath, "tsconfig.json"))
    s.stop("TypeScript configured")
  }

  s.start("Creating example files")
  fs.writeFileSync(path.join(aisxDir, "example.aisx.tsx"), ExampleTemplate)
  fs.writeFileSync(path.join(aisxDir, "example.aisx.test.tsx"), ExampleTest)
  s.stop("Created example templates")

  log.success(`AISX successfully integrated into your project`)
  log.info(`Get started by importing from your example template:`)
  const codeExample = `
  import { CompletionPrompt } from "./aisx/example.aisx.tsx"
  import aisx from "aisx"

  // Render the template
  const prompt = await aisx.render(<CompletionPrompt />)
  console.log(prompt)
  `

  console.log(colors.yellow(codeExample))
}

export default init
