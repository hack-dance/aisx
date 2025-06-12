"""
ES Module compatible template loader for AISX JSX templates
"""

import os
import json
import asyncio
import subprocess
import tempfile
from typing import Dict, Any, Optional, Union, List

class TemplateLoader:
    """
    Loads and renders AISX TSX template files with ES Module support
    """
    def __init__(self, templates_dir: Optional[str] = None):
        """
        Initialize the template loader with a directory for templates
        
        Args:
            templates_dir: Directory containing .aisx.tsx template files. If None,
                          will use the 'templates' directory next to this file.
        """
        if templates_dir is None:
            # Default to the 'templates' directory in the parent directory of this file
            module_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            templates_dir = os.path.join(module_dir, "templates")
        
        self.templates_dir = os.path.abspath(templates_dir)
        self.dist_dir = os.path.join(self.templates_dir, "dist")
        
        # Check if Node.js is available
        try:
            result = subprocess.run(
                ["node", "--version"], 
                check=True, 
                capture_output=True, 
                text=True
            )
            node_version = result.stdout.strip()
            print(f"Using Node.js version: {node_version}")
        except (subprocess.SubprocessError, FileNotFoundError):
            raise RuntimeError("Node.js is required but not found. Please install Node.js.")
        
        # Check if TypeScript is installed
        try:
            result = subprocess.run(
                ["tsc", "--version"],
                check=True,
                capture_output=True,
                text=True
            )
            ts_version = result.stdout.strip()
            print(f"Using TypeScript version: {ts_version}")
        except (subprocess.SubprocessError, FileNotFoundError):
            raise RuntimeError("TypeScript is required but not found. Please install TypeScript.")
        
        # Create dist directory if it doesn't exist
        os.makedirs(self.dist_dir, exist_ok=True)
        
        # Compile templates
        self._compile_templates()
    
    def _compile_templates(self):
        """Compile all TypeScript templates in the templates directory"""
        try:
            subprocess.run(
                ["tsc", "--project", self.templates_dir],
                check=True,
                capture_output=True,
                text=True
            )
        except subprocess.CalledProcessError as e:
            raise RuntimeError(f"Error compiling templates: {e.stderr}")
    
    def get_template_path(self, template_name: str) -> str:
        """
        Get the absolute path to a template file
        
        Args:
            template_name: Name of the template (with or without extension)
            
        Returns:
            Absolute path to the compiled template file
        """
        # Handle different ways the template name might be specified
        if not template_name.endswith(".aisx.tsx"):
            if template_name.endswith(".tsx"):
                template_name = template_name.replace(".tsx", ".aisx.tsx")
            else:
                template_name = f"{template_name}.aisx.tsx"
        
        # Get source and compiled paths
        source_path = os.path.join(self.templates_dir, template_name)
        compiled_path = os.path.join(
            self.dist_dir, 
            template_name.replace(".tsx", ".js")
        )
        
        if not os.path.exists(source_path):
            raise FileNotFoundError(f"Template not found: {source_path}")
        
        # Recompile if source is newer than compiled
        if not os.path.exists(compiled_path) or (
            os.path.getmtime(source_path) > os.path.getmtime(compiled_path)
        ):
            self._compile_templates()
        
        return compiled_path
    
    def render(self, template_name: str, props: Optional[Dict[str, Any]] = None) -> str:
        """
        Render a template synchronously
        
        Args:
            template_name: Name of the template file
            props: Props to pass to the template component
            
        Returns:
            Rendered template as a string
        """
        # Get the absolute path to the template
        template_path = self.get_template_path(template_name)
        
        # Create a temporary JavaScript file in the system temp directory
        with tempfile.NamedTemporaryFile(suffix='.mjs', mode='w', delete=False) as temp_file:
            temp_js_path = temp_file.name
            
            # Create the JavaScript file content
            js_content = r"""
// ES Module syntax
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Setup a require function for CommonJS modules
const require = createRequire(import.meta.url);

// Current file info
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Props passed from Python
const props = PROPS_PLACEHOLDER;

// Template file path
const templatePath = "TEMPLATE_PATH_PLACEHOLDER";

// Helper function to load AISX
async function loadAISX() {
    try {
        // Try different ways to import AISX
        try {
            const currentDir = process.cwd();
            const aisxPath = path.resolve(currentDir, 'node_modules/aisx/dist/index.js');
            console.log('Trying to load AISX from:', aisxPath);
            const aisxModule = await import(`file://${aisxPath}`);
            return aisxModule.default;
        } catch (e) {
            console.error(JSON.stringify({
                success: false, 
                error: `Could not load AISX: ${e.message}`,
                stack: e.stack,
                cwd: process.cwd()
            }));
            process.exit(1);
        }
    } catch (err) {
        console.error(JSON.stringify({
            success: false, 
            error: `Error loading AISX: ${err.message}`,
            stack: err.stack
        }));
        process.exit(1);
    }
}

// Simple function to render the template
async function renderTemplate() {
    try {
        // Load AISX
        const aisx = await loadAISX();
        
        // Read the template
        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        
        // Import and execute the template directly
        const templateModule = await import(`file://${templatePath}`);
        const Component = templateModule.default;
        
        if (!Component) {
            throw new Error("No default export found in template");
        }
        
        // Check if component is async
        if (Component.constructor && Component.constructor.name === 'AsyncFunction') {
            const result = await Component(props);
            return await aisx.renderAsync(result);
        } else {
            const result = Component(props);
            return aisx.render(result);
        }
    } catch (error) {
        throw new Error(`Error rendering template: ${error.message}`);
    }
}

// Execute the render function
renderTemplate()
    .then(result => {
        console.log(JSON.stringify({ success: true, result }));
    })
    .catch(error => {
        console.error(JSON.stringify({ 
            success: false, 
            error: error.message,
            stack: error.stack
        }));
    });
"""
            
            # Replace placeholders
            js_content = js_content.replace('PROPS_PLACEHOLDER', json.dumps(props or {}))
            js_content = js_content.replace('TEMPLATE_PATH_PLACEHOLDER', template_path.replace('\\', '\\\\'))
            
            # Write the JavaScript file
            temp_file.write(js_content)
        
        try:
            # Run the script
            result = subprocess.run(
                ["node", temp_js_path],
                capture_output=True,
                text=True,
            )
            
            # Check for errors
            if result.stderr:
                try:
                    error_data = json.loads(result.stderr)
                    if not error_data.get("success", False):
                        raise RuntimeError(f"JavaScript error: {error_data.get('error')}")
                except json.JSONDecodeError:
                    # Not JSON, just a regular error message
                    raise RuntimeError(f"Error running JavaScript: {result.stderr}")
            
            # Parse the result
            try:
                output_data = json.loads(result.stdout)
                if output_data.get("success", False):
                    return output_data.get("result", "")
                else:
                    raise RuntimeError(f"Error rendering template: {output_data.get('error')}")
            except json.JSONDecodeError:
                # Not JSON, just return the raw output
                return result.stdout
        
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_js_path):
                try:
                    os.remove(temp_js_path)
                except:
                    pass
    
    async def render_async(self, template_name: str, props: Optional[Dict[str, Any]] = None) -> str:
        """
        Render a template asynchronously
        
        Args:
            template_name: Name of the template file
            props: Props to pass to the template component
            
        Returns:
            Rendered template as a string
        """
        # Get the absolute path to the template
        template_path = self.get_template_path(template_name)
        
        # Create a temporary JavaScript file in the system temp directory
        with tempfile.NamedTemporaryFile(suffix='.mjs', mode='w', delete=False) as temp_file:
            temp_js_path = temp_file.name
            
            # Create the JavaScript file content (same as sync version, optimized for async)
            js_content = r"""
// ES Module syntax
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Setup a require function for CommonJS modules
const require = createRequire(import.meta.url);

// Current file info
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Props passed from Python
const props = PROPS_PLACEHOLDER;

// Template file path
const templatePath = "TEMPLATE_PATH_PLACEHOLDER";

// Helper function to load AISX
async function loadAISX() {
    try {
        // Try different ways to import AISX
        try {
            const currentDir = process.cwd();
            const aisxPath = path.resolve(currentDir, 'node_modules/aisx/dist/index.js');
            console.log('Trying to load AISX from:', aisxPath);
            const aisxModule = await import(`file://${aisxPath}`);
            return aisxModule.default;
        } catch (e) {
            console.error(JSON.stringify({
                success: false, 
                error: `Could not load AISX: ${e.message}`,
                stack: e.stack,
                cwd: process.cwd()
            }));
            process.exit(1);
        }
    } catch (err) {
        console.error(JSON.stringify({
            success: false, 
            error: `Error loading AISX: ${err.message}`,
            stack: err.stack
        }));
        process.exit(1);
    }
}

// Simple function to render the template
async function renderTemplate() {
    try {
        // Load AISX
        const aisx = await loadAISX();
        
        // Read the template
        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        
        // Import and execute the template directly
        const templateModule = await import(`file://${templatePath}`);
        const Component = templateModule.default;
        
        if (!Component) {
            throw new Error("No default export found in template");
        }
        
        // Check if component is async
        if (Component.constructor && Component.constructor.name === 'AsyncFunction') {
            const result = await Component(props);
            return await aisx.renderAsync(result);
        } else {
            const result = Component(props);
            return aisx.render(result);
        }
    } catch (error) {
        throw new Error(`Error rendering template: ${error.message}`);
    }
}

// Execute the render function
renderTemplate()
    .then(result => {
        console.log(JSON.stringify({ success: true, result }));
    })
    .catch(error => {
        console.error(JSON.stringify({ 
            success: false, 
            error: error.message,
            stack: error.stack
        }));
    });
"""
            
            # Replace placeholders
            js_content = js_content.replace('PROPS_PLACEHOLDER', json.dumps(props or {}))
            js_content = js_content.replace('TEMPLATE_PATH_PLACEHOLDER', template_path.replace('\\', '\\\\'))
            
            # Write the JavaScript file
            temp_file.write(js_content)
        
        try:
            # Create a future that will be completed when the subprocess completes
            loop = asyncio.get_running_loop()
            future = loop.create_future()
            
            # Run the Node.js script in a subprocess asynchronously
            async def run_node_async():
                try:
                    proc = await asyncio.create_subprocess_exec(
                        "node", temp_js_path,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE
                    )
                    
                    stdout, stderr = await proc.communicate()
                    
                    # Check for errors
                    if stderr:
                        stderr_str = stderr.decode('utf-8').strip()
                        try:
                            error_data = json.loads(stderr_str)
                            if not error_data.get("success", False):
                                future.set_exception(RuntimeError(
                                    f"JavaScript error: {error_data.get('error')}"
                                ))
                                return
                        except json.JSONDecodeError:
                            # Not JSON, just a regular error message
                            future.set_exception(RuntimeError(f"Error running JavaScript: {stderr_str}"))
                            return
                    
                    # Parse the result
                    stdout_str = stdout.decode('utf-8').strip()
                    try:
                        output_data = json.loads(stdout_str)
                        if output_data.get("success", False):
                            future.set_result(output_data.get("result", ""))
                        else:
                            future.set_exception(RuntimeError(
                                f"JavaScript error: {output_data.get('error')}"
                            ))
                    except json.JSONDecodeError:
                        # Not JSON, just return the raw output
                        future.set_result(stdout_str)
                except Exception as e:
                    future.set_exception(e)
                finally:
                    # Clean up the temporary file
                    if os.path.exists(temp_js_path):
                        try:
                            os.remove(temp_js_path)
                        except:
                            pass
            
            # Start the async task
            asyncio.create_task(run_node_async())
            
            # Wait for the result
            return await future
        
        except Exception as e:
            # Clean up the temporary file in case of error
            if os.path.exists(temp_js_path):
                try:
                    os.remove(temp_js_path)
                except:
                    pass
            raise e

# Create a default loader
_default_loader = None

def get_default_loader() -> TemplateLoader:
    """Get or create the default template loader"""
    global _default_loader
    if _default_loader is None:
        _default_loader = TemplateLoader()
    return _default_loader

def render_template(template_name: str, props: Optional[Dict[str, Any]] = None) -> str:
    """
    Render a template using the default loader
    
    Args:
        template_name: Name of the template file
        props: Props to pass to the template component
        
    Returns:
        Rendered template as a string
    """
    return get_default_loader().render(template_name, props)

async def render_template_async(template_name: str, props: Optional[Dict[str, Any]] = None) -> str:
    """
    Render a template asynchronously using the default loader
    
    Args:
        template_name: Name of the template file
        props: Props to pass to the template component
        
    Returns:
        Rendered template as a string
    """
    return await get_default_loader().render_async(template_name, props)