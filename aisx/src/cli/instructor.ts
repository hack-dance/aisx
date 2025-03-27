import _instructor from "@instructor-ai/instructor"
import OpenAI from "openai"

let instructor: ReturnType<typeof _instructor<OpenAI>> | null = null

function createInstructor(key?: string) {
  if (instructor) {
    return instructor
  }

  if (!key) {
    throw new Error("No API key provided")
  }

  const oai = new OpenAI({
    apiKey: key
  })

  instructor = _instructor({
    client: oai,
    mode: "TOOLS"
  })

  return instructor
}

export default createInstructor
