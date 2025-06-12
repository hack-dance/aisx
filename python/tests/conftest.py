"""
Shared test fixtures for AISX tests
"""
import os
import pytest
from aisx import AISX

@pytest.fixture
def aisx():
    """Get a fresh AISX instance for each test"""
    return AISX()

@pytest.fixture
def test_templates_dir():
    """Get the path to test template fixtures"""
    return os.path.join(os.path.dirname(__file__), "fixtures")

@pytest.fixture(autouse=True)
def setup_test_env(test_templates_dir):
    """Setup test environment variables"""
    os.environ["AISX_TEMPLATES_PATH"] = test_templates_dir
    yield
    # Cleanup
    if "AISX_TEMPLATES_PATH" in os.environ:
        del os.environ["AISX_TEMPLATES_PATH"] 