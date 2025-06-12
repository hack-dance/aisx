#!/usr/bin/env python3
"""
Example usage of AISX Python template loader with TSX file templates
"""
import sys
import os
import asyncio
from aisx.esm_template_loader import render_template


def main() -> None:
    try:
        # Render the Greeting TSX template with a simple context
        output = render_template("Greeting", {"name": "World"})
        print("Rendered Greeting:", output)
    except Exception as error:
        print("Error rendering Greeting template:", error)


if __name__ == "__main__":
    main() 