# AIML - AI Markup Language

AIML is a JSX-based templating engine for generating strings with TypeScript support. It provides a React-like syntax for creating, composing, and managing complex LLM prompts and other structured text templates.

## Why AIML?

Managing complex prompts for LLMs using template strings or manually concatenated functions quickly becomes a nightmare. AIML provides a clean, declarative way to define structured inputs for LLMs, making your prompts:

- Composable and reusable with component-based architecture
- Type-safe with full TypeScript support
- Easily and independently testable
- Dynamic with support for conditional rendering and variable inputs
- Maintainable with a familiar React-like syntax

## Features

- Write JSX/TSX that renders to strings
- Async components support for dynamic content generation
- Full TypeScript support out of the box
- Compatible with both Bun and Node.js
- Simple API with zero dependencies
- Supports `.aiml.tsx` file extension

## Installation

```bash
# Using npm
npm install aiml

# Using yarn
yarn add aiml

# Using pnpm
pnpm add aiml

# Using bun
bun add aiml
```

## Setup

AIML can be set up in various ways depending on your project requirements. Here are the recommended approaches:

### Standalone Setup (Recommended)

This setup is ideal for projects that don't use React or other JSX libraries.

1. **Configure TypeScript**

   Create or update your `tsconfig.json` to extend AIML's configuration:

   ```json
   {
     "extends": "aiml/tsconfig/aiml",
     "compilerOptions": {
       // Your additional compiler options
     }
   }
   ```

   The AIML tsconfig preset includes:
   - `jsx: "preserve"`
   - `jsxFactory: "jsx"`
   - `jsxFragmentFactory: "Fragment"`
   - `jsxImportSource: "aiml"`

2. **For Bun Users**

   Add the following to your `bunfig.toml`:

   ```toml
   # JSX settings for AIML files
   jsxImportSource = "aiml"

   # File-specific loaders
   [loader]
   ".tsx" = "tsx"
   ".aiml.tsx" = "tsx"
   ".aiml.test.tsx" = "tsx"
   ```

3. **File Naming Convention**

   Name your AIML template files with `.aiml.tsx` extension:

   ```
   template.aiml.tsx
   myPrompt.aiml.tsx
   ```

### Pragma-Based Setup

If you can't or don't want to configure TypeScript globally, you can use pragma comments at the top of each AIML file:

```tsx
/** @jsxImportSource aiml */

export function MyTemplate() {
  return (
    <message>
      <greeting>Hello, world!</greeting>
    </message>
  );
}
```

## Usage

### Basic Example

```tsx
// template.aiml.tsx
/** @jsxImportSource aiml */

export function Greeting(props: { name: string }) {
  return (
    <greeting>
      Hello, {props.name}!
    </greeting>
  );
}

export function AIPrompt(props: { instructions: string, role: string }) {
  return (
    <message>
      <role>{props.role}</role>
      <instructions>{props.instructions}</instructions>
    </message>
  );
}
```

```ts
// index.ts
import { Greeting, AIPrompt } from './template.aiml';

// Render the greeting
const greeting = <Greeting name="AIML" />;
console.log("Greeting Template:");
console.log(greeting);

// Render the AI prompt
const prompt = <AIPrompt 
  role="assistant" 
  instructions="You are a helpful AI assistant."
/>;
console.log("AI Prompt Template:");
console.log(prompt);
```

### Advanced Features

#### Async Components

AIML supports async components, making it possible to dynamically generate content based on external data:

```tsx
/** @jsxImportSource aiml */

// Async component that fetches data
export async function DynamicPrompt(props: { userId: string }) {
  const userData = await fetchUserData(props.userId);
  
  return (
    <instruction>
        You are assisting {userData.name} who is interested in {userData.interests.join(', ')}.
        Please tailor your responses accordingly.
    </instruction>
  );
}

// Usage
const dynamicPrompt = await <DynamicPrompt userId="123" />;
or 
const dynamicPrompt = await aiml.render(<DynamicPrompt userId="123" />;)
or 
const dynamicPrompt = DynamicPrompt({ userId: "123" })

```

#### Composition and Reuse

Build complex prompts through composition, just like React components:

```tsx
/** @jsxImportSource aiml */

function SystemPrompt(props: { persona: string }) {
  return (
    <system>
      You are {props.persona}. Respond in a way that matches this persona.
    </system>
  );
}

function ContextProvider(props: { 
  data: Record<string, unknown>,
  children: React.ReactNode 
}) {
  return (
    <context>
      <data>{JSON.stringify(props.data)}</data>

      {props.children}
    </context>
  );
}

export function ComplexPrompt() {
  const contextData = {
    timestamp: Date.now(),
    version: "1.0.0"
  };
  
  return (
    <message>
      <SystemPrompt persona="a helpful programming assistant" />

      <ContextProvider data={contextData}>
        <user_query>How do I use TypeScript with React?</user_query>
      </ContextProvider>
    </message>
  );
}
```

#### Conditional Rendering

Implement dynamic prompts based on conditions:

```tsx
/** @jsxImportSource aiml */

export function ConditionalPrompt(props: { 
  skill: "beginner" | "intermediate" | "advanced",
  topic: string 
}) {
  return (
    <prompt>
      <system>You are a coding tutor.</system>
      <instructions>
        {props.skill === "beginner" && (
          <beginner>
            Explain {props.topic} in simple terms with basic examples.
          </beginner>
        )}
        
        {props.skill === "intermediate" && (
          <intermediate>
            Provide detailed explanation of {props.topic} with practical examples.
          </intermediate>
        )}
        
        {props.skill === "advanced" && (
          <advanced>
            Explain advanced concepts of {props.topic} with complex examples and best practices.
          </advanced>
        )}
      </instructions>
    </prompt>
  );
}
```

## Customizing JSX Elements

Just like with React, you can compose AIML components, execute code, etc.

AIML also allows you to define custom JSX elements with TypeScript interfaces. You can extend the JSX namespace in your own declaration files:

```typescript
// custom.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    // Add your custom elements
    thinking_model: Record<string, unknown>
    system_message: {
      temperature?: number
      model?: string
    }
  }
}
```

With this configuration, you can use your custom elements in AIML templates with built-in type checking:

```tsx
/** @jsxImportSource aiml */

export function ThinkingPrompt() {
  return (
    <thinking_model>
      <system_message temperature={0.7} model="gpt-4">
        First, analyze the problem step by step.
        Then, provide a solution with explanations.
      </system_message>
    </thinking_model>
  );
}
```

## Testing AIML Components

You can unit test your AIML components just like you would test React components:

```tsx
// prompt.test.tsx
import { expect, test } from 'bun:test';
import { GreetingPrompt } from './prompt.aiml';

test('GreetingPrompt renders correctly', async () => {
  const result = <GreetingPrompt name="Tester" />;
  expect(result).toContain('Hello, Tester!');
  expect(result).toContain('<greeting>');
});
```

## Important Notes

### Integration with React Projects

**Not Recommended**: Running AIML alongside React in the same project can lead to JSX runtime conflicts and type checking issues. It's possible to do in situations where its really needed but the recommended approach is to justt keep your templates in a seperate package that doesn't need to transpile react too.

For projects that require both React UI components and AIML templates, consider one of these approaches:

1. **Separate Packages**: Keep AIML templates in a separate package from your React components.

## Development

For contributors looking to develop AIML further:

1. Clone the repository
2. Install dependencies with `bun install`
3. Build the package with `bun run build`
4. Run tests with `bun test`

## License

MIT
