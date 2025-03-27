<p align="center">
<img src="./public/aisx.svg" style="max-width:400px;" />
</p>
<p align="center">
_aisx - AI Markup Language_
</p>

---

aisx is a JSX-based templating engine for generating strings with TypeScript support. It provides a React-like syntax for creating, composing, and managing complex LLM prompts and other structured text templates.

> From the makers of [instructor-js](https://github.com/hack-dance/instructor-js), [zod-stream](https://github.com/hack-dance/zod-stream), and [schema-stream](https://github.com/hack-dance/schema-stream) - While our other tools focus on structured *outputs*, aisx is all about structured *inputs*. We've come full circle! 🔄

## Why aisx?

Managing complex prompts for LLMs using template strings or manually concatenated functions quickly becomes a nightmare. aisx provides a clean, declarative way to define structured inputs for LLMs, making your prompts:

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
- Supports `.aisx.tsx` file extension

## Installation

```bash
# Using npm
npm install aisx

# Using yarn
yarn add aisx

# Using pnpm
pnpm add aisx

# Using bun
bun add aisx
```

## Setup

For comprehensive setup instructions and troubleshooting, please refer to [SETUP.md](./SETUP.md).

Below is a quick overview of how to set up aisx in your project. aisx can be configured in various ways depending on your project requirements:

### Standalone Setup (Recommended)

This setup is ideal for projects that don't use React or other JSX libraries.

1. **Configure TypeScript**

   Create or update your `tsconfig.json` to extend aisx's configuration:

   ```json
   {
     "extends": "aisx/tsconfig/aisx",
     "compilerOptions": {
       // Your additional compiler options
     }
   }
   ```

   The aisx tsconfig preset includes:
   - `jsx: "preserve"`
   - `jsxFactory: "jsx"`
   - `jsxFragmentFactory: "Fragment"`
   - `jsxImportSource: "aisx"`

2. **For Bun Users**

   Add the following to your `bunfig.toml`:

   ```toml
   # JSX settings for aisx files
   jsxImportSource = "aisx"

   # File-specific loaders
   [loader]
   ".tsx" = "tsx"
   ".aisx.tsx" = "tsx"
   ".aisx.test.tsx" = "tsx"
   ```

3. **File Naming Convention**

   Name your aisx template files with `.aisx.tsx` extension:

   ```
   template.aisx.tsx
   myPrompt.aisx.tsx
   ```

### Pragma-Based Setup

If you can't or don't want to configure TypeScript globally, you can use pragma comments at the top of each aisx file:

```tsx
/** @jsxImportSource aisx */

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
// template.aisx.tsx
/** @jsxImportSource aisx */

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
import { Greeting, AIPrompt } from './template.aisx';

// There are multiple ways to use aisx components:

// 1. Function call (simplest approach)
const greeting = Greeting({ name: "aisx" });
console.log("Greeting Template:");
console.log(greeting);

// 2. JSX syntax (requires JSX support in your project)
const prompt = <AIPrompt 
  role="assistant" 
  instructions="You are a helpful AI assistant."
/>;
console.log("AI Prompt Template:");
console.log(prompt);

// 3. Using the render function (useful for async components)
import aisx from 'aisx';
const renderedPrompt = aisx.render(<AIPrompt 
  role="assistant" 
  instructions="You are a helpful AI assistant."
/>);
```

### Advanced Features

#### Async Components

aisx supports async components, making it possible to dynamically generate content based on external data:

```tsx
/** @jsxImportSource aisx */

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

// Usage options:
// 1. Await the JSX expression
const dynamicPrompt = await <DynamicPrompt userId="123" />;

// 2. Use the render function
const dynamicPrompt = await aisx.render(<DynamicPrompt userId="123" />);

// 3. Direct function call (returns a Promise)
const dynamicPrompt = await DynamicPrompt({ userId: "123" });
```

#### Real-World Example: Context Builder

Here's how you might use aisx to build a complex context for an LLM call:

```tsx
/** @jsxImportSource aisx */

// Component to format user profile data
async function UserContext({ userId }: { userId: string }) {
  const user = await fetchUserProfile(userId);
  const recentOrders = await fetchRecentOrders(userId);
  
  return (
    <user_context>
      <profile>
        <name>{user.fullName}</name>
        <account_type>{user.accountType}</account_type>
        <membership_since>{user.createdAt}</membership_since>
        <preferences>{JSON.stringify(user.preferences)}</preferences>
      </profile>
      
      <recent_orders>
        {recentOrders.map(order => (
          <order id={order.id} date={order.date}>
            <status>{order.status}</status>
            <items>{order.items.map(item => item.name).join(", ")}</items>
          </order>
        ))}
      </recent_orders>
    </user_context>
  );
}

// Component to build product recommendations
async function ProductRecommendations({ userId, category }: { userId: string; category: string }) {
  const recommendations = await generateRecommendations(userId, category);
  
  return (
    <recommendations>
      {recommendations.map(product => (
        <product id={product.id}>
          <name>{product.name}</name>
          <match_score>{product.score}</match_score>
          <key_features>{product.features.join(", ")}</key_features>
        </product>
      ))}
    </recommendations>
  );
}

// Main prompt builder that composes multiple context sources
export async function CustomerSupportPrompt({ 
  userId, 
  query,
  productCategory
}: { 
  userId: string; 
  query: string;
  productCategory?: string;
}) {
  return (
    <prompt>
      <system>
        <instructions>
          You are a helpful customer support assistant for our e-commerce store.
          Use the provided context to answer customer queries accurately.
          If you don't know the answer, admit it and offer to connect them with a human agent.
        </instructions>
      </system>
      
      <context>
        <UserContext userId={userId} />
        
        {productCategory && (
          <ProductRecommendations userId={userId} category={productCategory} />
        )}
        
        <current_query>
          <timestamp>{new Date().toISOString()}</timestamp>
          <query_text>{query}</query_text>
        </current_query>
      </context>
    </prompt>
  );
}
```

#### Composition and Reuse

Build complex prompts through composition, just like React components:

```tsx
/** @jsxImportSource aisx */

function SystemPrompt(props: { persona: string }) {
  return (
    <s>
      You are {props.persona}. Respond in a way that matches this persona.
    </s>
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
/** @jsxImportSource aisx */

export function ConditionalPrompt(props: { 
  skill: "beginner" | "intermediate" | "advanced",
  topic: string 
}) {
  return (
    <prompt>
      <s>You are a coding tutor.</s>
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

Just like with React, you can compose aisx components, execute code, etc.

aisx also allows you to define custom JSX elements with TypeScript interfaces. You can extend the JSX namespace in your own declaration files:

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

With this configuration, you can use your custom elements in aisx templates with built-in type checking:

```tsx
/** @jsxImportSource aisx */

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

## Testing aisx Components

You can unit test your aisx components just like you would test React components:

```tsx
// prompt.test.tsx
import { expect, test } from 'bun:test';
import { GreetingPrompt } from './prompt.aisx';

test('GreetingPrompt renders correctly', async () => {
  const result = <GreetingPrompt name="Tester" />;
  expect(result).toContain('Hello, Tester!');
  expect(result).toContain('<greeting>');
});
```

## Important Notes

### Integration with React Projects

**Not Recommended**: Running aisx alongside React in the same project can lead to JSX runtime conflicts and type checking issues. It's possible to do in situations where it's really needed, but the recommended approach is to keep your templates in a separate package that doesn't need to transpile React too.

For projects that require both React UI components and aisx templates, consider one of these approaches:

1. **Separate Packages**: Keep aisx templates in a separate package from your React components.

### Output Formats

While the default output is an XML-like format, you can create wrapper components to output in different formats like Markdown or plain text without the element wrappers.

## Development

For contributors looking to develop aisx further:

1. Clone the repository
2. Install dependencies with `bun install`
3. Build the package with `bun run build`
4. Run tests with `bun test`

## License

MIT
