#!/usr/bin/env node
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

import { log } from "@clack/prompts"
import init from "../src/cli/init"

init().catch(error => {
  log.error(`Error during initialization: ${error}`)
  process.exit(1)
})
