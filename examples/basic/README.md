# aisx Basic Example

This example demonstrates the basic usage of aisx for creating JSX templates that render to strings, with a focus on building AI prompts.

## Features Demonstrated

- Basic component creation and composition
- Props and typings
- Async components
- Multiple rendering approaches
- Fragment usage

## Running the Example

```bash
# Install dependencies
bun install

# Run the example
bun start
```

## Code Walkthrough

The example consists of:

1. `template.aisx.tsx` - Contains the template components:
   - `Greeting` - A simple component with props
   - `SystemPrompt` - A component for system instructions
   - `DynamicContext` - An async component that simulates fetching data
   - `AIPrompt` - A composite component that combines all the above

2. `index.ts` - Shows different ways to use the components:
   - Direct function calls
   - JSX syntax with render utility
   - Handling async components

## Output

The example will output several rendered templates showing how the components transform into string output that can be used for LLM prompts or other text-based applications.
