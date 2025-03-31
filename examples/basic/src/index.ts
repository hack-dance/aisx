/** @jsxImportSource aisx */

import { Greeting, RenderMixedAsync, AIPrompt } from "./template.aisx"
import aisx from "aisx"

console.log("Greeting Template:")
console.log(Greeting({ name: "John" }))
console.log("\n")

console.log("AI Prompt Template:")
console.log(
  await AIPrompt({
    model: "GPT-4",
    instructions: "You are a helpful assistant that provides concise responses."
  })
)
console.log("\n")

console.log("Render Mixed Async:")
const mixedResult = await aisx.renderAsync(RenderMixedAsync())
console.log(mixedResult)
