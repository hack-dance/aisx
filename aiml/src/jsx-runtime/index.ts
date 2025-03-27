import { BaseProps, Component } from ".."
import { Fragment, jsx, jsxs } from "./jsx-runtime"
import { JSXFunction } from "./types"

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

export function render(element: unknown): string | Promise<string> {
  if (typeof element === "string") {
    return element
  }

  if (element instanceof Promise) {
    return element.then(resolved => render(resolved))
  }

  return jsx(Fragment, { children: element })
}

export default (function aiml() {
  return {
    render,
    jsx,
    jsxs,
    Fragment
  }
})()
