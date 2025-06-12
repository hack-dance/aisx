"""
Tests for core AISX functionality
"""
import pytest
from aisx import render, render_async, AISX

def test_sync_render_basic(aisx):
    """Test basic synchronous rendering"""
    result = aisx.render("<div>Hello World</div>")
    assert result.strip() == "<div>Hello World</div>"

def test_sync_render_with_props(aisx):
    """Test synchronous rendering with props"""
    jsx = """
    function Component(props) {
        return (
            <div>
                <h1>{props.title}</h1>
                <p>{props.content}</p>
            </div>
        );
    }
    """
    result = aisx.render(jsx, {"title": "Hello", "content": "World"})
    assert "<h1>Hello</h1>" in result
    assert "<p>World</p>" in result

def test_sync_render_error(aisx):
    """Test synchronous rendering error handling"""
    with pytest.raises(RuntimeError) as exc_info:
        aisx.render("function Component() { return <div>{invalid.prop}</div>; }")
    assert "error" in str(exc_info.value).lower()

@pytest.mark.asyncio
async def test_async_render_basic(aisx):
    """Test basic asynchronous rendering"""
    result = await aisx.render_async("<div>Hello World</div>")
    assert result.strip() == "<div>Hello World</div>"

@pytest.mark.asyncio
async def test_async_render_with_props(aisx):
    """Test asynchronous rendering with props"""
    jsx = """
    function Component(props) {
        return (
            <div>
                <h1>{props.title}</h1>
                <p>{props.content}</p>
            </div>
        );
    }
    """
    result = await aisx.render_async(jsx, {"title": "Hello", "content": "World"})
    assert "<h1>Hello</h1>" in result
    assert "<p>World</p>" in result

@pytest.mark.asyncio
async def test_async_render_error(aisx):
    """Test asynchronous rendering error handling"""
    with pytest.raises(RuntimeError) as exc_info:
        await aisx.render_async("function Component() { return <div>{invalid.prop}</div>; }")
    assert "error" in str(exc_info.value).lower()

def test_global_render_function():
    """Test the global render function"""
    result = render("<div>Hello World</div>")
    assert result.strip() == "<div>Hello World</div>"

@pytest.mark.asyncio
async def test_global_render_async_function():
    """Test the global render_async function"""
    result = await render_async("<div>Hello World</div>")
    assert result.strip() == "<div>Hello World</div>" 