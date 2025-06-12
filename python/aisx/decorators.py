"""
AISX Python decorators for creating JSX components
"""
import inspect
import functools
from typing import Callable, Dict, Any, Optional, Union

def jsx_component(func: Callable) -> Callable:
    """
    Decorator to mark a function as a JSX component.
    The function should return a JSX string.
    
    Example:
        @jsx_component
        def Greeting(props):
            return f"<div>Hello, {props.get('name', 'World')}!</div>"
    
    Args:
        func: The function to decorate
        
    Returns:
        The decorated function
    """
    @functools.wraps(func)
    def wrapper(props: Optional[Dict[str, Any]] = None, **kwargs) -> str:
        props = props or {}
        props.update(kwargs)
        result = func(props)
        return result
    
    # Mark the function as a JSX component
    wrapper.__jsx_component__ = True
    return wrapper

def async_jsx_component(func: Callable) -> Callable:
    """
    Decorator to mark a function as an async JSX component.
    The function should return a JSX string asynchronously.
    
    Example:
        @async_jsx_component
        async def AsyncGreeting(props):
            name = await get_name_async()
            return f"<div>Hello, {name}!</div>"
    
    Args:
        func: The function to decorate
        
    Returns:
        The decorated function
    """
    @functools.wraps(func)
    async def wrapper(props: Optional[Dict[str, Any]] = None, **kwargs) -> str:
        props = props or {}
        props.update(kwargs)
        result = await func(props)
        return result
    
    # Mark the function as an async JSX component
    wrapper.__jsx_component__ = True
    wrapper.__async__ = True
    return wrapper

def is_jsx_component(func: Callable) -> bool:
    """
    Check if a function is a JSX component
    
    Args:
        func: The function to check
        
    Returns:
        True if the function is a JSX component, False otherwise
    """
    return hasattr(func, "__jsx_component__") and func.__jsx_component__ is True

def is_async_jsx_component(func: Callable) -> bool:
    """
    Check if a function is an async JSX component
    
    Args:
        func: The function to check
        
    Returns:
        True if the function is an async JSX component, False otherwise
    """
    return is_jsx_component(func) and hasattr(func, "__async__") and func.__async__ is True