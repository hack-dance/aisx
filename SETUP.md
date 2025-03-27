# aisx Setup Guide

This guide covers how to set up aisx in different environments.

## Recommended Setup (Standalone)

For projects that don't use React or other JSX libraries, this is the simplest and most reliable setup.

### Basic TypeScript and Bun Setup

1. Install the package:

   ```bash
   # Using npm
   npm install @hack-dance/aisx
   
   # Using yarn
   yarn add @hack-dance/aisx
   
   # Using pnpm
   pnpm add @hack-dance/aisx
   
   # Using bun
   bun add @hack-dance/aisx
   ```

2. Configure `tsconfig.json` by extending aisx's provided configuration:

   ```json
   {
     "extends": "aisx/tsconfig/aisx",
     "compilerOptions": {
       // Your additional compiler options
       "moduleResolution": "bundler",
       "target": "ESNext",
       "module": "ESNext",
       "allowImportingTsExtensions": true,
       "noEmit": true
     },
     "include": [
       "./**/*.ts",
       "./**/*.tsx"
     ]
   }
   ```

3. Create a type declaration file `aisx.d.ts` to ensure TypeScript recognizes aisx JSX:

   ```typescript
   /// <reference types="aisx/types/global" />
   ```

4. For Bun users, add the following to your `bunfig.toml`:

   ```toml
   # JSX settings for aisx files
   jsxImportSource = "aisx"
   
   # File-specific loaders
   [loader]
   ".tsx" = "tsx"
   ".aisx.tsx" = "tsx"
   ".aisx.test.tsx" = "tsx"
   ```

5. Create a `.aisx.tsx` file:

   ```tsx
   /** @jsxImportSource aisx */
   
   import aisx from "aisx"
   
   export function Greeting(props: { name: string }) {
     return (
       <greeting>
         Hello, {props.name}!
       </greeting>
     )
   }
   ```

6. Import and use it:

   ```ts
   import { Greeting } from "./greeting.aisx.tsx"
   
   // Function call approach (simplest)
   const greeting = Greeting({ name: "world" })
   console.log(greeting)
   
   // JSX approach (requires JSX support in your project)
   import aisx from "aisx"
   
   // For regular components
   const jsxGreeting = <Greeting name="world" />
   console.log(jsxGreeting)
   
   // For async components
   const asyncResult = await aisx.render(<AsyncComponent prop="value" />)
   console.log(asyncResult)
   ```

### Pragma-Based Setup

If you prefer not to modify global TypeScript settings, you can use a JSX pragma at the top of each aisx file:

```tsx
/** @jsxImportSource aisx */

export function Greeting(props: { name: string }) {
  return (
    <greeting>
      Hello, {props.name}!
    </greeting>
  )
}
```

## Working with Async Components

aisx fully supports async components, which are particularly useful for dynamic content generation:

```tsx
/** @jsxImportSource aisx */

// Async component that fetches data
export async function DynamicPrompt(props: { userId: string }) {
  const userData = await fetchUserData(props.userId)
  
  return (
    <instruction>
      You are assisting {userData.name} who is interested in {userData.interests.join(', ')}.
      Please tailor your responses accordingly.
    </instruction>
  )
}

// Usage options:
// 1. Await the JSX expression
const dynamicPrompt = await <DynamicPrompt userId="123" />

// 2. Use the render function (recommended for complex cases)
import aisx from "aisx"
const renderedPrompt = await aisx.render(<DynamicPrompt userId="123" />)

// 3. Direct function call (returns a Promise)
const directPrompt = await DynamicPrompt({ userId: "123" })
```

## Mixed Environment Setups (Not Recommended)

Running aisx alongside React in the same project is not recommended due to JSX runtime conflicts. However, if you must do this, the following configurations might help.

### File-Specific JSX Configuration

1. Create `tsconfig.aisx.json`:

   ```json
   {
     "extends": "./tsconfig.json",
     "compilerOptions": {
       "jsx": "react-jsx",
       "jsxImportSource": "aisx"
     },
     "include": ["**/*.aisx.tsx"]
   }
   ```

2. Configure your build tool to use the appropriate tsconfig for each file type.

### Next.js Setup

For Next.js, configure aisx in your `next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add .aisx.tsx support
    config.module.rules.push({
      test: /\.aisx\.tsx$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['next/babel'],
          plugins: [
            ['@babel/plugin-transform-react-jsx', {
              runtime: 'automatic',
              importSource: 'aisx'
            }]
          ]
        }
      }
    });
    
    return config;
  }
};

module.exports = nextConfig;
```

### Vite Setup

For Vite, create a plugin in `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createFilter } from '@rollup/pluginutils';

export default defineConfig({
  plugins: [
    // Regular React plugin for .tsx files
    react(),
    
    // Custom plugin for .aisx.tsx files
    {
      name: 'vite-plugin-aisx',
      transform(code, id) {
        const filter = createFilter('**/*.aisx.tsx');
        if (filter(id)) {
          return {
            code,
            map: null,
            customTransformCache: {
              jsx: 'automatic',
              jsxImportSource: 'aisx'
            }
          };
        }
      }
    }
  ]
});
```

## Customizing JSX Elements

aisx allows you to define custom JSX elements by extending the JSX namespace in your declaration files:

```typescript
// custom.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    // Add your custom elements
    custom_element: Record<string, unknown>
    another_element: {
      required_prop: string
      optional_prop?: number
    }
  }
}
```

## Common Patterns and Best Practices

### Fragment Usage

When you need to return multiple elements without a wrapper:

```tsx
import aisx from "aisx"

export function MultipleElements() {
  return (
    <aisx.Fragment>
      <first_element>First content</first_element>
      <second_element>Second content</second_element>
    </aisx.Fragment>
  )
}
```

### Component Composition

Build complex templates through composition:

```tsx
function Header({ title }: { title: string }) {
  return <header>{title}</header>
}

function Body({ content }: { content: string }) {
  return <body>{content}</body>
}

export function Document({ title, content }: { title: string; content: string }) {
  return (
    <document>
      <Header title={title} />
      <Body content={content} />
    </document>
  )
}
```

## Troubleshooting

### Common Issues

1. **JSX transpilation errors**: Ensure your build system is correctly configured to process .aisx.tsx files.

2. **Wrong JSX runtime used**: Check that the `jsxImportSource` is correctly set to "aisx" for .aisx.tsx files.

3. **Type errors with JSX**: Add reference directives to your declaration file:

   ```ts
   /// <reference types="aisx" />
   /// <reference types="aisx/types/global" />
   ```

4. **Async component issues**: Make sure you're properly awaiting the result when using async components.

   ```ts
   // Correct
   const result = await <AsyncComponent />
   // or
   const result = await aisx.render(<AsyncComponent />)
   
   // Incorrect - this will return a Promise
   const result = <AsyncComponent />
   ```

### Environment-Specific Solutions

#### Node.js without TypeScript

If you're using Node.js without TypeScript, you'll need a transpiler like Babel:

```js
// babel.config.js
module.exports = {
  presets: ['@babel/preset-env'],
  plugins: [
    ['@babel/plugin-transform-react-jsx', {
      runtime: 'automatic',
      importSource: 'aisx'
    }]
  ]
};
```

#### Deno

For Deno, use the JSX pragma:

```tsx
/** @jsxImportSource aisx */

export function Template() {
  return <div>Hello from Deno</div>;
}
```

## Additional Resources

For more information and examples, please see:
- The main [README.md](./README.md)
- The [examples](./examples) directory
- The [tests](./tests) directory for more complex usage patterns