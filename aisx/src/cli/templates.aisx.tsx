/** @jsxImportSource aisx */

import aisx from "../jsx-runtime"

function Pragma() {
  return <aisx.Fragment>{`/** @jsxImportSource aisx */`}</aisx.Fragment>
}

function MainImport() {
  return <aisx.Fragment>{`import aisx from "aisx"`}</aisx.Fragment>
}

function TestContent() {
  return (
    <aisx.Fragment>{`
    import { describe, test, expect } from "bun:test"
    import aisx from "aisx"
    import { SystemPrompt, UserMessage } from "./example.aisx.tsx"

    describe("AISX Templates", () => {
      test("should render a system prompt correctly", async () => {
        const model = "gpt-4"
        const instructions = "You are a helpful assistant."
        
        const rendered = await aisx.render(
          <SystemPrompt model={model} instructions={instructions} />
        )
        
        expect(rendered).toContain("<system>")
        expect(rendered).toContain("<model>gpt-4</model>")
        expect(rendered).toContain("<instructions>You are a helpful assistant.</instructions>")
      })
      
      test("should render a user message correctly", async () => {
        const content = "Hello, world!"
        
        const rendered = await aisx.render(
          <UserMessage content={content} />
        )
        
        expect(rendered).toContain("<user>")
        expect(rendered).toContain("<content>Hello, world!</content>")
      })
    })
  `}</aisx.Fragment>
  )
}

function TypeScriptDefinitionContent() {
  return <aisx.Fragment>{`/// <reference types="aisx/types/global" />`}</aisx.Fragment>
}

function ExampleTemplateContent() {
  return (
    <aisx.Fragment>{`
      interface SystemPromptProps {
        model: string
        instructions: string
      }

      export function SystemPrompt({ model, instructions }: SystemPromptProps) {
        return (
          <system>
            <model>{model}</model>
            <instructions>{instructions}</instructions>
          </system>
        )
      }

      interface UserMessageProps {
        content: string
      }

      export function UserMessage({ content }: UserMessageProps) {
        return (
          <user>
            <content>{content}</content>
          </user>
        )
      }

      export async function CompletionPrompt() {
        return (
          <aisx.Fragment>
            <SystemPrompt 
              model="gpt-4" 
              instructions="You are a helpful assistant that provides concise responses."
            />
            <UserMessage content="Explain the concept of recursion in programming." />
          </aisx.Fragment>
        )
      }
  `}</aisx.Fragment>
  )
}

export const TypeScriptDefinition = await aisx.render(<TypeScriptDefinitionContent />)
export const ExampleTest = await aisx.render(
  <aisx.Fragment>
    <Pragma />
    <MainImport />
    <TestContent />
  </aisx.Fragment>
)

export const ExampleTemplate = await aisx.render(
  <aisx.Fragment>
    <Pragma />
    <MainImport />
    <ExampleTemplateContent />
  </aisx.Fragment>
)
