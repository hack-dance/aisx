"""
AISX Python - Main implementation
"""

import asyncio
import os
import json
import subprocess
from typing import Optional, Dict, Any, Union

class NodeJSBridge:
    """
    A simple bridge to run JavaScript code via Node.js subprocess
    """
    def __init__(self):
        """
        Initialize the bridge
        """
        # Check if Node.js is available
        try:
            subprocess.run(["node", "--version"], check=True, capture_output=True)
        except (subprocess.SubprocessError, FileNotFoundError):
            raise RuntimeError("Node.js is required but not found. Please install Node.js.")
        
        # Get the path to the bridge.mjs file
        self.bridge_path = os.path.join(os.path.dirname(__file__), "bridge.mjs")
    
    def run_bridge(self, command: str, jsx_string: str, props: Optional[Dict[str, Any]] = None):
        """
        Run a command through the bridge and return the result
        
        Args:
            command: The bridge command to run ('render' or 'renderAsync')
            jsx_string: JSX template string to render
            props: Optional props to pass to the template
            
        Returns:
            Result of the JavaScript code
        """
        # Run the bridge script with the command and JSX string
        cmd = ["node", self.bridge_path, command, jsx_string]
        if props is not None:
            cmd.append(json.dumps(props))
            
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
        )
        
        # Check for errors in stderr
        if result.stderr:
            try:
                error_data = json.loads(result.stderr)
                if not error_data.get("success", False):
                    raise RuntimeError(f"JavaScript error: {error_data.get('error')}")
            except json.JSONDecodeError:
                # Not JSON, just a regular error message
                raise RuntimeError(f"Error running JavaScript: {result.stderr}")
        
        try:
            output_data = json.loads(result.stdout)
            if output_data.get("success", False):
                return output_data.get("result")
            else:
                raise RuntimeError(f"JavaScript error: {output_data.get('error')}")
        except json.JSONDecodeError:
            # Not JSON, just return the raw output
            return result.stdout

class AISX:
    """
    AISX Python bindings for the JavaScript AISX library
    """
    def __init__(self):
        """Initialize AISX"""
        self.node = NodeJSBridge()
        
    def render(self, jsx_string: str, props: Optional[Dict[str, Any]] = None) -> str:
        """
        Render a JSX string to a regular string
        
        Args:
            jsx_string: JSX template string
            props: Optional props to pass to the template
            
        Returns:
            Rendered string
        """
        result = self.node.run_bridge("render", jsx_string, props)
        return str(result) if result is not None else ""
    
    async def render_async(self, jsx_string: str, props: Optional[Dict[str, Any]] = None) -> str:
        """
        Render a JSX string with async support
        
        Args:
            jsx_string: JSX template string
            props: Optional props to pass to the template
            
        Returns:
            Rendered string
        """
        # Create a future that will be completed when the subprocess completes
        loop = asyncio.get_running_loop()
        future = loop.create_future()
        
        # Run the Node.js script in a subprocess asynchronously
        async def run_node_async():
            try:
                cmd = ["node", self.node.bridge_path, "renderAsync", jsx_string]
                if props is not None:
                    cmd.append(json.dumps(props))
                    
                proc = await asyncio.create_subprocess_exec(
                    *cmd,
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
        
        # Start the async task
        asyncio.create_task(run_node_async())
        
        # Wait for the result
        return await future

# Singleton instance for easier usage
_default_instance = None

def get_default_instance() -> AISX:
    """Get or create the default AISX instance"""
    global _default_instance
    if _default_instance is None:
        _default_instance = AISX()
    return _default_instance

def render(jsx_string: str, props: Optional[Dict[str, Any]] = None) -> str:
    """
    Render a JSX string to a regular string using the default AISX instance
    
    Args:
        jsx_string: JSX template string
        props: Optional props to pass to the template
        
    Returns:
        Rendered string
    """
    return get_default_instance().render(jsx_string, props)

async def render_async(jsx_string: str, props: Optional[Dict[str, Any]] = None) -> str:
    """
    Render a JSX string with async support using the default AISX instance
    
    Args:
        jsx_string: JSX template string
        props: Optional props to pass to the template
        
    Returns:
        Rendered string
    """
    return await get_default_instance().render_async(jsx_string, props)