# AISX Python Quickstart

This is a proof-of-concept implementation of Python bindings for the AISX JSX templating library.

## Dependencies

To run the examples, you need:

1. Python 3.8+
2. Node.js 14+ (installed and available in PATH)

## Running the Examples

From the `python` directory:

```bash
# Run the basic example
python example.py

# Run the advanced example
python advanced_example.py
```

## Implementation Details

This implementation uses Node.js subprocesses to bridge between Python and JavaScript. It runs JavaScript code via the Node.js interpreter and communicates through JSON serialization.

The implementation includes:

1. Basic Python bindings for AISX using direct Node.js calls
2. Support for async/await in both languages
3. Decorators for defining JSX components in Python
4. Component-based templating patterns
5. Example code showing various usage patterns

## How It Works

1. The Python code creates a Node.js subprocess
2. JSX strings are passed to Node.js for rendering
3. The results are returned back to Python
4. Async operations are properly bridged between Python asyncio and JavaScript Promises

## Next Steps for Production

This is a proof-of-concept. For a production implementation, consider:

1. Better error handling and reporting
2. More robust Node.js process management (perhaps using a persistent Node.js server)
3. Proper package distribution
4. Performance optimizations (minimize subprocess creation)
5. A more idiomatic Python API with better integration of JSX syntax
6. Unit tests and documentation
7. Support for different AISX versions
8. Integration with popular Python web frameworks like Flask or FastAPI
9. Improved debugging experience