# AIML Setup Guide

This guide covers how to set up AIML in different environments.

## Recommended Setup (Standalone)

For projects that don't use React or other JSX libraries, this is the simplest and most reliable setup.

### Basic TypeScript and Bun Setup

1. Install the package:

   ```bash
   # Using npm
   npm install aiml
   
   # Using bun
   bun add aiml
   ```

2. Configure `tsconfig.json` by extending AIML's provided configuration:

   ```json
   {
     "extends": "aiml/tsconfig/aiml",
     "compilerOptions": {
       // Your additional compiler options
       "moduleResolution": "bundler",
       "target": "ESNext",
       "module": "ESNext"
     }
   }
   ```

3. For Bun users, add the following to your `bunfig.toml`:

   ```toml
   # JSX settings for AIML files
   jsxImportSource = "aiml"
   
   # File-specific loaders
   [loader]
   ".tsx" = "tsx"
   ".aiml.tsx" = "tsx"
   ".aiml.test.tsx" = "tsx"
   ```

4. Create a `.aiml.tsx` file:

   ```tsx
   
   function Name({ name: string }) {

    return (<name>{name}</name>)
   }
   export function Greeting(props: { name: string }) {
     return (
       <greeting>
         Hello, <Name name={name} />
       </greeting>
     );
   }
   ```

5. Import and use it:

   ```ts
   import { Greeting } from "./greeting.aiml.tsx";
   
   const greeting = Greeting({ name: "world" })
   console.log(greeting);
   ```

### Pragma-Based Setup

If you prefer not to modify global TypeScript settings, you can use a JSX pragma at the top of each AIML file:

```tsx
/** @jsxImportSource aiml */

export function Greeting(props: { name: string }) {
  return (
    <greeting>
      Hello, {props.name}!
    </greeting>
  );
}
```

## Mixed Environment Setups (Not Recommended)

Running AIML alongside React in the same project is not recommended due to JSX runtime conflicts. However, if you must do this, the following configurations might help.

### File-Specific JSX Configuration

1. Create `tsconfig.aiml.json`:

   ```json
   {
     "extends": "./tsconfig.json",
     "compilerOptions": {
       "jsx": "react-jsx",
       "jsxImportSource": "aiml"
     },
     "include": ["**/*.aiml.tsx"]
   }
   ```

2. Configure your build tool to use the appropriate tsconfig for each file type.

### Next.js Setup

For Next.js, configure AIML in your `next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add .aiml.tsx support
    config.module.rules.push({
      test: /\.aiml\.tsx$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['next/babel'],
          plugins: [
            ['@babel/plugin-transform-react-jsx', {
              runtime: 'automatic',
              importSource: 'aiml'
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
    
    // Custom plugin for .aiml.tsx files
    {
      name: 'vite-plugin-aiml',
      transform(code, id) {
        const filter = createFilter('**/*.aiml.tsx');
        if (filter(id)) {
          return {
            code,
            map: null,
            customTransformCache: {
              jsx: 'automatic',
              jsxImportSource: 'aiml'
            }
          };
        }
      }
    }
  ]
});
```

## Customizing JSX Elements

AIML allows you to define custom JSX elements by extending the JSX namespace in your declaration files:

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

## Troubleshooting

### Common Issues

1. **JSX transpilation errors**: Ensure your build system is correctly configured to process .aiml.tsx files.

2. **Wrong JSX runtime used**: Check that the `jsxImportSource` is correctly set to "aiml" for .aiml.tsx files.

3. **Type errors with JSX**: Add reference directives to your declaration file:

   ```ts
   /// <reference types="aiml" />
   /// <reference types="aiml/types/global" />
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
      importSource: 'aiml'
    }]
  ]
};
```

#### Deno

For Deno, use the JSX pragma:

```tsx
/** @jsxImportSource aiml */

export function Template() {
  return <div>Hello from Deno</div>;
}
```

## Additional Resources

For more information and examples, please see the main [README.md](./README.md) or open an issue on our GitHub repository.
