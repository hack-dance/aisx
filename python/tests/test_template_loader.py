"""
Tests for AISX template loader functionality
"""
import os
import pytest
from aisx import TemplateLoader, render_template, render_template_async

@pytest.fixture
def template_loader():
    """Create a template loader for testing"""
    fixtures_dir = os.path.join(os.path.dirname(__file__), "fixtures")
    return TemplateLoader(fixtures_dir)

def test_template_loader_init(template_loader):
    """Test template loader initialization"""
    assert template_loader.templates_dir.endswith("fixtures")
    assert os.path.exists(template_loader.templates_dir)
    assert os.path.exists(template_loader.dist_dir)

def test_render_template_basic(template_loader):
    """Test basic template rendering"""
    result = template_loader.render("Greeting", {"name": "World"})
    assert "<h1>Hello World!</h1>" in result
    assert "<p>Welcome to AISX</p>" in result

@pytest.mark.asyncio
async def test_render_template_async_basic(template_loader):
    """Test basic async template rendering"""
    result = await template_loader.render_async("Greeting", {"name": "World"})
    assert "<h1>Hello World!</h1>" in result
    assert "<p>Welcome to AISX</p>" in result

def test_render_template_missing():
    """Test rendering a missing template"""
    with pytest.raises(FileNotFoundError):
        render_template("NonExistentTemplate", {"name": "World"})

@pytest.mark.asyncio
async def test_render_template_async_missing():
    """Test rendering a missing template asynchronously"""
    with pytest.raises(FileNotFoundError):
        await render_template_async("NonExistentTemplate", {"name": "World"})

def test_render_template_invalid_props(template_loader):
    """Test rendering with invalid props"""
    with pytest.raises(RuntimeError):
        template_loader.render("Greeting", {"invalid": "props"})

@pytest.mark.asyncio
async def test_render_template_async_invalid_props(template_loader):
    """Test async rendering with invalid props"""
    with pytest.raises(RuntimeError):
        await template_loader.render_async("Greeting", {"invalid": "props"}) 