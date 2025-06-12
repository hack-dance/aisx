"""
AISX Python - Python bindings for AISX JSX templating library
"""

from .aisx import AISX, render, render_async
from .decorators import jsx_component, async_jsx_component
from .esm_template_loader import (
    TemplateLoader, 
    render_template, 
    render_template_async,
    get_default_loader
)

__all__ = [
    "AISX", 
    "render", 
    "render_async", 
    "jsx_component", 
    "async_jsx_component",
    "TemplateLoader",
    "render_template",
    "render_template_async",
    "get_default_loader"
]