import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { createRequire } from "module"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const require = createRequire(import.meta.url)

// Try to load AISX from various paths
let aisx
try {
  aisx = await import("aisx")
} catch (e) {
  try {
    const aisxPath = join(__dirname, "..", "node_modules", "aisx")
    aisx = await import(aisxPath)
  } catch (innerE) {
    console.error(
      JSON.stringify({
        success: false,
        error: `Could not load AISX: ${innerE.message}`
      })
    )
    process.exit(1)
  }
}

const { render, renderAsync } = aisx.default || aisx

if (!render || !renderAsync) {
  console.error(
    JSON.stringify({
      success: false,
      error: `AISX module does not export render and renderAsync functions. Available exports: ${Object.keys(aisx)}`
    })
  )
  process.exit(1)
}

// Handle sync rendering
if (process.argv[2] === "render") {
  const jsx = process.argv[3]
  const props = process.argv[4] ? JSON.parse(process.argv[4]) : {}

  try {
    const result = render(jsx, props)
    console.log(JSON.stringify({ success: true, result }))
  } catch (error) {
    console.error(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    )
  }
}

// Handle async rendering
if (process.argv[2] === "renderAsync") {
  const jsx = process.argv[3]
  const props = process.argv[4] ? JSON.parse(process.argv[4]) : {}

  try {
    const result = await renderAsync(jsx, props)
    console.log(JSON.stringify({ success: true, result }))
  } catch (error) {
    console.error(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    )
  }
}
