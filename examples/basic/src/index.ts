import { AIPrompt, Greeting } from "./template.aiml"

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
