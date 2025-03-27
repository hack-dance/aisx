/** @jsxImportSource aisx */

import aisx from "aisx"

interface GreetingProps {
  name: string
  role?: string
}

export function Greeting({ name, role = "user" }: GreetingProps) {
  return (
    <message>
      <greeting>Hello {name}!</greeting>
      <role>You are a {role}</role>
    </message>
  )
}

export function SystemPrompt({ model, instructions }: { model: string; instructions: string }) {
  return (
    <s>
      <model>{model}</model>
      <instructions>{instructions}</instructions>
    </s>
  )
}

async function fetchContextData() {
  await new Promise(resolve => setTimeout(resolve, 100))
  return {
    user: {
      preferences: ["Concise answers", "Code examples", "Visual explanations"],
      recentTopics: ["TypeScript", "React Hooks", "State Management"]
    },
    app: {
      version: "1.0.5",
      features: ["Documentation", "Code Snippets", "Tutorials"]
    }
  }
}

export async function DynamicContext() {
  const contextData = await fetchContextData()

  return (
    <context>
      <user_preferences>
        {contextData.user.preferences.map(pref => (
          <preference>{pref}</preference>
        ))}
      </user_preferences>

      <recent_topics>
        {contextData.user.recentTopics.map(topic => (
          <topic>{topic}</topic>
        ))}
      </recent_topics>

      <app_info>
        <version>{contextData.app.version}</version>
        <available_features>
          {contextData.app.features.map(feature => (
            <feature>{feature}</feature>
          ))}
        </available_features>
      </app_info>
    </context>
  )
}

export function AIPrompt({ model, instructions }: { model: string; instructions: string }) {
  return (
    <aisx.Fragment>
      <SystemPrompt model={model} instructions={instructions} />
      <Greeting name="User" role="human" />
      <DynamicContext />
    </aisx.Fragment>
  )
}

export function RenderMixedAsync() {
  console.log("Dynamic mixed Context (Async):")
  DynamicContext().then(result => {
    console.log(result)
    console.log("\n")

    return aisx
      .render(
        <AIPrompt
          model="GPT-4"
          instructions="You are a helpful assistant that provides concise responses."
        >
          {result}
        </AIPrompt>
      )
      .then(rendered => {
        console.log("Complete Rendered Template:")
        console.log(rendered)
      })
  })
}
