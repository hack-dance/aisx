/** @jsxImportSource aisx */

import { AIPrompt, Greeting, DynamicContext, RenderMixedAsync } from "./template.aisx"
import aisx from "aisx"

// Basic function call approach
console.log("Greeting Template:")
console.log(Greeting({ name: "John" }))
console.log("\n")

console.log("AI Prompt Template:")
console.log(
  AIPrompt({
    model: "GPT-4",
    instructions: "You are a helpful assistant that provides concise responses."
  })
)

console.log("\n")

console.log("Render Mixed Async:")
RenderMixedAsync()
