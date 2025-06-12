# AISX Python

Python bindings for the [AISX](https://github.com/hack-dance/aiml/tree/main/aisx) JSX templating library.

## Installation

```bash
pip install aisx-python
```

### Requirements

- Python 3.8+
- Node.js 14+ (needs to be installed and available in PATH)

## Usage

There are two main ways to use AISX Python:

1. **Template Files**: Create `.aisx.tsx` files and render them from Python
2. **Inline Templates**: Use JSX strings directly in your Python code

## Template Files (Recommended)

Create TypeScript JSX files and render them from Python:

### Example Template File: `templates/Greeting.aisx.tsx`

```tsx
interface GreetingProps {
  name: string;
  showDate?: boolean;
}

function Greeting({ name, showDate = false }: GreetingProps) {
  return (
    <div className="greeting">
      <h1>Hello, {name}!</h1>
      {showDate && <p>Today is {new Date().toLocaleDateString()}</p>}
    </div>
  );
}

export default Greeting;
```

### Render Template from Python

```python
from aisx import render_template, render_template_async
import asyncio

# Synchronous rendering
result = render_template("Greeting", {
    "name": "Python User",
    "showDate": True
})
print(result)

# Async rendering (for async components)
async def main():
    result = await render_template_async("AsyncDemo", {
        "delay": 500
    })
    print(result)

asyncio.run(main())
```

### Custom Template Directory

```python
from aisx import TemplateLoader

# Create a loader with a custom template directory
loader = TemplateLoader(templates_dir="/path/to/templates")

# Render a template
result = loader.render("MyTemplate", {"prop1": "value1"})
```

## Inline Templates

You can also use AISX directly with JSX strings:

### Basic Usage

```python
from aisx import render

# Simple template
result = render("<div>Hello World</div>")
print(result)  # <div>Hello World</div>

# With JavaScript variables/expressions
result = render("<div>{1 + 2}</div>")
print(result)  # <div>3</div>
```

### Async Templates

```python
import asyncio
from aisx import render_async

async def main():
    # Async template
    result = await render_async("<div>{await Promise.resolve('Hello Async')}</div>")
    print(result)  # <div>Hello Async</div>

asyncio.run(main())
```

### Component-Based Templates

```python
from aisx import jsx_component, async_jsx_component, render_async
import asyncio

@jsx_component
def Header(props):
    title = props.get("title", "Default Title")
    return f"<header><h1>{title}</h1></header>"

@async_jsx_component
async def AsyncContent(props):
    await asyncio.sleep(0.5)  # Simulate async operation
    content = props.get("content", "Default Content")
    return f"<div>{content}</div>"

async def main():
    template = f"""
    <div>
        {Header({"title": "Hello from Python"})}
        {await AsyncContent({"content": "This was loaded asynchronously"})}
    </div>
    """
    result = await render_async(template)
    print(result)

asyncio.run(main())
```

## How It Works

AISX Python uses Node.js subprocesses to execute the JavaScript AISX runtime. This approach:

1. Doesn't require any non-standard Python packages
2. Maintains full compatibility with the JavaScript AISX library
3. Allows both synchronous and asynchronous rendering
4. Works with any JSX syntax supported by AISX
5. Supports `.aisx.tsx` template files with TypeScript

## JSX Syntax

AISX Python supports the same JSX syntax as AISX for JavaScript. See the [AISX documentation](https://github.com/hack-dance/aiml/tree/main/aisx) for more details.

## License

MIT