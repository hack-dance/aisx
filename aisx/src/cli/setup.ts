#!/usr/bin/env node
import os from "node:os"
import fs from "fs"
import path from "path"
import { intro, outro, text, confirm, select, spinner, log } from "@clack/prompts"

import { z } from "zod"

import createInstructor from "./instructor"

async function respond(message: string) {
  const config = await configCheck()

  if (!config) {
    return outro("maybe next time...")
  }

  const instructor = createInstructor(config.openaiKey)
  const responseStream = await instructor.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that will help me setup a new project with AISX.
        I will provide you with some information about the project and you will help me setup the project with AISX.
        `
      },
      {
        role: "user",
        content: message
      }
    ],
    model: "gpt-4o-mini",
    stream: true,
    response_model: {
      name: "setup",
      schema: z.object({
        setup: z.string()
      })
    }
  })

  log.step("aisx:")

  process.stdout.write("\x1b[s")
  for await (const data of responseStream) {
    process.stdout.write("\x1b[u\x1b[2K")
    process.stdout.write(data?.setup ?? "")
  }
  console.log("\n")
}

const configSchema = z.object({
  user: z.string(),
  openaiKey: z.string()
})

type Config = z.infer<typeof configSchema>

async function configCheck(): Promise<false | Config> {
  let hasGlobalConfig = false
  let hasLocalConfig = false

  let config: false | Config = false

  const checkForGlobalConfig = await spinner()
  checkForGlobalConfig.start("Checking for global config...")

  const currentDir = process.cwd()
  const homeDir = os.homedir()

  try {
    hasGlobalConfig = fs.existsSync(path.join(homeDir, ".aisxrc"))
    checkForGlobalConfig.message(`Global config: ${hasGlobalConfig ? "found" : "not found"}`)

    hasLocalConfig = fs.existsSync(path.join(currentDir, ".aisxrc"))
    checkForGlobalConfig.message(`Local config: ${hasLocalConfig ? "found" : "not found"}`)
  } catch (error) {
    checkForGlobalConfig.message("Error checking for config")
  } finally {
    checkForGlobalConfig.stop()
  }

  if (hasGlobalConfig) {
    config = JSON.parse(fs.readFileSync(path.join(homeDir, ".aisxrc"), "utf8"))
  }

  if (hasLocalConfig) {
    config = JSON.parse(fs.readFileSync(path.join(currentDir, ".aisxrc"), "utf8"))
  }

  if (!hasGlobalConfig && !hasLocalConfig) {
    const aliveConfirm = await confirm({
      message: "Do you want to bring me to life?",
      active: "yes, please",
      inactive: "no way",
      initialValue: true
    })

    if (!aliveConfirm) {
      return false
    }

    const createConfig = await select({
      message: "No config found, would you like to create one?",
      options: [
        {
          label: "yup, create a local config",
          value: "local"
        },
        { label: "let's create a global config", value: "global" },
        { label: "get me out of here", value: "exit" }
      ]
    })

    if (createConfig === "exit") {
      return false
    }

    const configValues: Partial<z.infer<typeof configSchema>> = {
      user: undefined,
      openaiKey: undefined
    }

    try {
      const inputtedUser = await text({
        message: "What should I call you?",
        placeholder: "John Doe"
      })

      if (inputtedUser && typeof inputtedUser === "string") {
        configValues.user = inputtedUser
      }

      const inputtedOpenaiKey = await text({
        message: "What is your OpenAI API key?",
        placeholder: "sk-..."
      })

      if (inputtedOpenaiKey && typeof inputtedOpenaiKey === "string") {
        configValues.openaiKey = inputtedOpenaiKey
      }
    } catch (error) {
      log.error("Error setting up config")
    }

    const configLoader = await spinner()

    configLoader.start("Setting up config...")
    const config = configSchema.safeParse(configValues)

    if (!config.success) {
      log.error("Error setting up config")
      configLoader.stop()
    }

    const configFile =
      createConfig === "global" ? path.join(homeDir, ".aisxrc") : path.join(currentDir, ".aisxrc")

    fs.writeFileSync(configFile, JSON.stringify(config.data, null, 2))
    configLoader.message("Config set up successfully")

    createInstructor(configValues.openaiKey)

    configLoader.stop()
  }

  return config
}

async function chat() {
  const message = await text({
    message: "You"
  })

  await respond(message as string)

  chat()
}

async function setup() {
  intro("AISX Setup")
  const config = await configCheck()

  if (!config) {
    return outro("maybe next time...")
  }

  chat()
}

if (require.main === module) {
  setup().catch(console.error)
}

export default setup
