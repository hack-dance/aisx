from setuptools import setup, find_packages

setup(
    name="aisx-python",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[],  # No external dependencies besides Python standard library
    description="Python bindings for AISX JSX templating library",
    author="hack-dance",
    author_email="dimitri@sick.email",
    url="https://github.com/hack-dance/aisx",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Programming Language :: Python :: 3.13",
    ],
    python_requires=">=3.8",
)