/** @jsxImportSource aiml */

import { Fragment } from "aiml"

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
    <system>
      <model>{model}</model>
      <instructions>{instructions}</instructions>
    </system>
  )
}

export function AIPrompt({ model, instructions }: { model: string; instructions: string }) {
  return (
    <Fragment>
      <SystemPrompt model={model} instructions={instructions} />
      <Greeting name="User" role="human" />
    </Fragment>
  )
}
