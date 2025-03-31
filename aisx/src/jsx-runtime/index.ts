import { BaseProps, Component, Children } from ".."
import { Fragment, jsx, jsxs } from "./jsx-runtime"
import { JSXFunction, RenderTreeContext } from "./types"

declare global {
  let jsx: JSXFunction
  let jsxs: JSXFunction
  let Fragment: string | Component<BaseProps>
}

// Register JSX runtime globally
if (typeof globalThis !== "undefined") {
  //@ts-expect-error - globalThis is not typed
  globalThis.jsx = jsx
  //@ts-expect-error - globalThis is not typed
  globalThis.jsxs = jsxs
  //@ts-expect-error - globalThis is not typed
  globalThis.Fragment = Fragment
}

export { jsx as jsxDEV } from "./jsx-runtime"
export { jsx, jsxs, Fragment }

export * from "./types"

const defaultContext: RenderTreeContext = {
  isRoot: true,
  depth: 0,
  tree: undefined,
  parent: undefined
}

export function render(
  element: Children,
  context: RenderTreeContext = defaultContext
): string | Promise<string> {
  return jsx(
    Fragment,
    { children: element },
    {
      ...context,
      isRoot: true,
      parentIsAsync: false,
      depth: 0
    }
  )
}

export async function renderAsync(
  element: Children,
  context: RenderTreeContext = defaultContext
): Promise<string> {
  return jsx(
    Fragment,
    { children: element },
    {
      ...context,
      isRoot: true,
      parentIsAsync: true,
      depth: 0
    }
  )
}

export default (function aisx() {
  return {
    render,
    renderAsync,
    jsx,
    jsxs,
    Fragment
  }
})()
