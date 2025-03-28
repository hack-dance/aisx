import type {
  BaseProps,
  BasePropsWithChildren,
  Component,
  RenderNode,
  RenderTreeContext,
  AsyncContext,
  Child,
  Children
} from "./types"

/**
 * AisxError types
 */
type AisxErrorType = "AisxError" | "PendingError" | "RenderTreeError" | "PromiseRejection"

/**
 * AisxError class
 */
class AisxError extends Error {
  type: AisxErrorType
  context: RenderTreeContext
  message: string
  renderTree?: string
  originalError?: Error

  constructor(
    type: AisxErrorType,
    message: string,
    context: RenderTreeContext,
    originalError?: Error
  ) {
    super(message)
    this.name = "AisxError"
    this.type = type
    this.context = context
    this.originalError = originalError
    this.message = this.buildMessage(message)

    if (context.tree) {
      this.renderTree = formatRenderTree(context.tree)
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AisxError)

      if (originalError?.stack) {
        this.stack = `${this.stack}\nCaused by: ${originalError.stack}`
      }
    }
  }

  buildMessage(message: string): string {
    let fullMessage = `${this.type}: ${message}`

    if (this.renderTree) {
      fullMessage += "\n\nRender Tree:\n" + this.renderTree
    }

    return fullMessage
  }

  static isAisxError(error: unknown): error is AisxError {
    return error instanceof AisxError
  }
}

/**
 * Helper to check if a Promise is pending
 * @param p - The Promise to check
 * @returns True if the Promise is pending, false otherwise
 */
const isPending = (p: Promise<unknown>) => {
  const temp = {} as any
  return Promise.race([p, temp]).then(
    v => v === temp,
    () => false
  )
}

/**
 * Logger utility for Aisx
 */
const AisxLogger = {
  warn(error: AisxError) {
    const lines: string[] = []

    lines.push("\n🚨 AISX Warning 🚨")
    lines.push("═".repeat(50))

    lines.push(`Type: ${error.type}`)
    lines.push(`Message: ${error.message}`)

    if (error.renderTree) {
      lines.push("\nRender Tree:")
      lines.push("─".repeat(50))
      lines.push(error.renderTree)
    }

    if (error.originalError) {
      lines.push("\nOriginal Error:")
      lines.push("─".repeat(50))
      lines.push(error.originalError.message)
      if (error.originalError.stack) {
        lines.push("\nStack Trace:")
        lines.push(error.originalError.stack)
      }
    }

    lines.push("═".repeat(50))

    console.warn("\x1b[33m%s\x1b[0m", lines.join("\n"))
  },

  error(error: AisxError) {
    const lines: string[] = []

    lines.push("\n❌ AISX Error ❌")
    lines.push("═".repeat(50))

    lines.push(`Type: ${error.type}`)
    lines.push(`Message: ${error.message}`)

    if (error.renderTree) {
      lines.push("\nRender Tree:")
      lines.push("─".repeat(50))
      lines.push(error.renderTree)
    }

    if (error.originalError) {
      lines.push("\nOriginal Error:")
      lines.push("─".repeat(50))
      lines.push(error.originalError.message)
      if (error.originalError.stack) {
        lines.push("\nStack Trace:")
        lines.push(error.originalError.stack)
      }
    }

    lines.push("═".repeat(50))

    console.error("\x1b[31m%s\x1b[0m", lines.join("\n"))
  }
}

/**
 * Enforce await on async content
 * @param result - The result to enforce await on
 * @param context - The async context
 * @returns The result of the Promise
 */
const enforceAwait = async (
  result: Promise<string>,
  context: AsyncContext & { tree?: RenderNode } = {}
): Promise<string> => {
  if (context.isRoot && !context.parentIsAsync) {
    const pending = await isPending(result)
    if (pending) {
      let errorMessage =
        "Render result must be awaited - there are pending Promises in the render tree"

      if (context.tree) {
        const validation = validateRenderTree(context.tree)
        if (!validation.valid) {
          errorMessage += "\n\nValidation Issues:\n" + validation.issues.join("\n")
        }
      }

      const error = new AisxError("PendingError", errorMessage, context)
      AisxLogger.error(error)

      const detectAwait = new Promise<never>((_, reject) => {
        queueMicrotask(() => {
          reject(error)
        })
      })

      return Promise.race([result, detectAwait])
    }
  }
  return result
}

/**
 * Stringify a value
 * @param value - The value to stringify
 * @param isAttribute - Whether the value is an attribute
 * @param context - The async context
 * @returns The stringified value
 */
const stringifyValue = async (
  value: unknown,
  isAttribute = false,
  context?: RenderTreeContext
): Promise<string> => {
  if (value instanceof Promise) {
    try {
      const resolvedValue = await value
      return stringifyValue(resolvedValue, isAttribute, context)
    } catch (error) {
      AisxLogger.warn(
        new AisxError(
          "PromiseRejection",
          "Promise rejected during render",
          context || { isRoot: false },
          error instanceof Error ? error : undefined
        )
      )
      return ""
    }
  }

  if (
    value === null ||
    value === undefined ||
    (typeof value === "object" && !Array.isArray(value))
  ) {
    if (value instanceof Date) {
      return value.toISOString()
    }

    if (typeof value === "object" && value !== null) {
      try {
        return JSON.stringify(value)
      } catch (error) {
        AisxLogger.warn(
          new AisxError(
            "AisxError",
            "Failed to stringify object",
            context || { isRoot: false },
            error instanceof Error ? error : undefined
          )
        )
        return ""
      }
    }

    return ""
  }

  if (Array.isArray(value)) {
    const settled = await Promise.allSettled(
      value.map(v => stringifyValue(v, isAttribute, context))
    )
    return settled
      .map(result => (result.status === "fulfilled" ? result.value : ""))
      .filter(Boolean)
      .join("")
  }

  if (!isAttribute && typeof value === "boolean") {
    return ""
  }

  if (typeof value === "function") {
    try {
      const functionResult = (value as () => unknown)()
      return stringifyValue(functionResult, isAttribute, context)
    } catch (error) {
      AisxLogger.warn(
        new AisxError(
          "AisxError",
          "Function execution failed",
          context || { isRoot: false },
          error instanceof Error ? error : undefined
        )
      )
      return ""
    }
  }

  return String(value as string | number | boolean | bigint | symbol)
}

const formataisx = (str: string) => {
  return str
    .trim()
    .replace(/>\s*,\s*</g, "><")
    .replace(/,\s*</g, "<")
    .replace(/>\s*,/g, ">")
    .replace(/\s+/g, " ")
    .replace(/\s+>/g, ">")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
    .replace(/,([^,\s])/g, "$1")
    .replace(/([^,\s]),/g, "$1")
}

/**
 * Fragment component name
 */
const Fragment = "Fragment"

/**
 * Reserved props
 */
const RESERVED_PROPS = new Set(["key", "ref", "children"])

const formatRenderTree = (node: RenderNode | Child, indent = ""): string => {
  if (!node) return ""

  if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
    return `${indent}${String(node)}\n`
  }

  if (node instanceof Promise) {
    return `${indent}Promise\n`
  }

  if (typeof node === "function") {
    return `${indent}${node.name}\n`
  }

  if (Array.isArray(node)) {
    return node.map(child => formatRenderTree(child, indent)).join("")
  }

  if (!("name" in node)) {
    return `${indent}Unknown\n`
  }

  const asyncMark = node.isAsync ? "⚡️" : "  "
  const promiseMark = node.hasPromises ? "🔄" : "  "
  let result = `${indent}${asyncMark}${promiseMark} ${node.name}\n`

  const sortedChildren = [...node.childNodes].sort((a, b) => a.name.localeCompare(b.name))
  for (const child of sortedChildren) {
    result += formatRenderTree(child, indent + "  ")
  }

  return result
}

/**
 * Validate the render tree for async safety
 * @param node - The node to validate
 * @returns The validation result
 */
const validateRenderTree = (node: RenderNode): { valid: boolean; issues: string[] } => {
  const issues: string[] = []

  if (!node.isAsync && node.hasPromises) {
    const getNodePath = (node: RenderNode, path: string[] = []): string[] => {
      path.unshift(node.name)
      if (node.parent) {
        return getNodePath(node.parent, path)
      }
      return path
    }

    issues.push(
      `Component "${getNodePath(node).join(" -> ")}" contains Promises but is not marked async. This will cause runtime errors.`
    )
  }

  for (const child of node.childNodes) {
    const childValidation = validateRenderTree(child)
    issues.push(...childValidation.issues)
  }

  return { valid: issues.length === 0, issues }
}

/**
 * Convert a child to a RenderNode
 * @param tag - The tag to render
 * @param props - The props to render
 * @param context - The async context
 * @returns The rendered string or Promise<string>
 */
function childToRenderNode<P extends BaseProps>(
  tag: string | Component<P>,
  props: P,
  context: RenderTreeContext
): RenderNode {
  const nodeName = typeof tag === "function" ? tag.name || "AnonymousComponent" : tag
  return {
    name: nodeName,
    isAsync: typeof tag === "function" && tag.constructor.name === "AsyncFunction",
    depth: context.depth ?? 0,
    children: [],
    childNodes: [],
    props,
    hasPromises: false,
    parent: context.parent
  }
}

/**
 * Add children to a node
 * @param node - The node to add children to
 * @param children - The children to add
 * @param context - The async context
 */
function addChildren(node: RenderNode, children: Children | null) {
  if (!children) {
    node.children = []
    return
  }

  node.children = children

  const childArray = Array.isArray(children) ? children : [children]
  childArray.forEach((child, index) => {
    if (!child) return

    const childNode = createChildNode(child, node, index)
    node.childNodes.push(childNode)

    if (childNode.hasPromises) {
      node.hasPromises = true
    }
  })
}

/**
 * Create a child node from a Child type
 */
function createChildNode(child: Child, parentNode: RenderNode, index?: number): RenderNode {
  const childName =
    typeof child === "function" ? child.name || `Child${index ?? ""}`
    : child instanceof Promise ? "AsyncContent"
    : Array.isArray(child) ? `ArrayNode${index ?? ""}`
    : typeof child === "object" ? `Child${index ?? ""}`
    : `TextNode${index ?? ""}`

  return {
    name: childName,
    isAsync:
      typeof child === "function" ?
        child.constructor.name === "AsyncFunction"
      : child instanceof Promise,
    depth: parentNode.depth + 1,
    children: Array.isArray(child) ? child : [],
    childNodes: [],
    props: null,
    hasPromises:
      child instanceof Promise || (Array.isArray(child) && child.some(c => c instanceof Promise)),
    parent: parentNode
  }
}

/**
 * JSX runtime function
 * @param tag - The tag to render
 * @param props - The props to render
 * @param context - The async context
 * @returns The rendered string or Promise<string>
 */
function jsx<P extends BaseProps>(
  tag: string | Component<P>,
  props: P | null,
  context: RenderTreeContext = { isRoot: true, depth: 0 }
): string | Promise<string> {
  let hasPromise = false
  let result: string | Promise<string>

  const currentNode: RenderNode = childToRenderNode<P>(tag, props as P, context)

  if (context.isRoot) {
    context.tree = currentNode
  } else if (context.parent) {
    currentNode.depth = context.parent.depth + 1
    context.parent.childNodes.push(currentNode)
  }

  if (props?.children) {
    addChildren(currentNode, props.children)
  }

  const updateParentChain = () => {
    if (currentNode.hasPromises) {
      let parent = currentNode.parent
      while (parent) {
        parent.hasPromises = true
        if (parent.name !== Fragment) {
          parent.isAsync = true
        }
        parent = parent.parent
      }
    }
  }

  const childContext: RenderTreeContext = {
    isRoot: false,
    parentIsAsync: currentNode.isAsync,
    depth: currentNode.depth + 1,
    parent: currentNode,
    tree: context.tree
  }

  if (typeof tag === "function") {
    try {
      result = tag(props as P)

      if (result instanceof Promise) {
        hasPromise = true
        currentNode.hasPromises = true
        currentNode.isAsync = true
        updateParentChain()

        return enforceAwait(
          result
            .then(async r => {
              const resultNode: RenderNode = {
                name: `${currentNode.name}Result`,
                isAsync: true,
                depth: currentNode.depth + 1,
                children: props?.children ?? [],
                childNodes: [],
                hasPromises: false,
                parent: currentNode
              }
              currentNode.childNodes.push(resultNode)

              const str = typeof r === "string" ? r : await stringifyValue(r, false, childContext)
              return formataisx(str)
            })
            .catch(error => {
              AisxLogger.warn(
                new AisxError(
                  "PromiseRejection",
                  "Component promise rejected",
                  childContext,
                  error instanceof Error ? error : undefined
                )
              )
              return ""
            }),
          childContext
        )
      }

      // Handle children props
      const propsChildren = (props as any)?.children
      if (propsChildren) {
        if (Array.isArray(propsChildren)) {
          const hasAsyncChildren = propsChildren.some(
            child => child?.constructor?.name === "AsyncFunction" || child instanceof Promise
          )
          if (hasAsyncChildren) {
            currentNode.isAsync = true
            currentNode.hasPromises = true
            updateParentChain()
          }
        } else if (
          propsChildren?.constructor?.name === "AsyncFunction" ||
          propsChildren instanceof Promise
        ) {
          currentNode.isAsync = true
          currentNode.hasPromises = true
          updateParentChain()
        }
      }

      const allValues = [
        ...Object.values(props || {}),
        ...(Array.isArray(propsChildren) ? propsChildren : [propsChildren])
      ].filter(Boolean)

      hasPromise = allValues.some(v => v instanceof Promise)
      currentNode.hasPromises = hasPromise
      currentNode.isAsync = currentNode.isAsync || hasPromise
      updateParentChain()

      if (hasPromise) {
        return enforceAwait(
          Promise.allSettled(
            allValues.map(v => (v instanceof Promise ? v : Promise.resolve(v)))
          ).then(async settled => {
            const str = settled
              .filter(result => result.status === "fulfilled")
              .map(result => (result as PromiseFulfilledResult<unknown>).value)
              .map(r => (typeof r === "string" ? r : stringifyValue(r, false, childContext)))
              .join("")

            return formataisx(str)
          }),
          childContext
        )
      }

      return formataisx(typeof result === "string" ? result : String(result))
    } catch (error) {
      if (error instanceof Promise) {
        hasPromise = true
        currentNode.hasPromises = true
        currentNode.isAsync = true
        updateParentChain()

        return enforceAwait(
          error
            .then(async resolved => {
              const str =
                typeof resolved === "string" ? resolved : (
                  await stringifyValue(resolved, false, childContext)
                )
              return formataisx(str)
            })
            .catch(err => {
              AisxLogger.warn(
                new AisxError(
                  "PromiseRejection",
                  "Suspended promise rejected",
                  childContext,
                  err instanceof Error ? err : undefined
                )
              )
              return ""
            }),
          childContext
        )
      }
      throw error
    }
  }

  if (tag === Fragment) {
    const { children } = (props ?? {}) as BasePropsWithChildren

    if (!children) {
      return ""
    }

    const childrenArray = Array.isArray(children) ? children : [children]

    childrenArray.forEach((child, index) => {
      if (child) {
        const childNode = createChildNode(child, currentNode, index)
        currentNode.childNodes.push(childNode)
        if (childNode.hasPromises) {
          currentNode.hasPromises = true
        }
      }
    })

    const hasPromiseChildren = childrenArray.some(child => child instanceof Promise)
    if (hasPromiseChildren) {
      hasPromise = true
      currentNode.hasPromises = true
      updateParentChain()

      return Promise.allSettled(
        childrenArray.map(child => (child instanceof Promise ? child : Promise.resolve(child)))
      ).then(async settled => {
        const results = await Promise.allSettled(
          settled
            .filter(result => result.status === "fulfilled")
            .map(result => (result as PromiseFulfilledResult<unknown>).value)
            .map(r => (typeof r === "string" ? r : stringifyValue(r, false, childContext)))
        )

        return formataisx(
          results
            .filter(result => result.status === "fulfilled")
            .map(result => (result as PromiseFulfilledResult<string>).value)
            .join("")
        )
      })
    }

    return formataisx(childrenArray.map(child => String(child)).join(""))
  }

  const propsWithDefaults = (props ?? {}) as BasePropsWithChildren
  const { children: propChildren, ...propAttrs } = propsWithDefaults

  const attrsEntries = Object.entries(propAttrs).filter(
    ([k, v]) => v !== undefined && !RESERVED_PROPS.has(k)
  )

  const hasPromiseAttrs = attrsEntries.some(([_, v]) => v instanceof Promise)
  const hasPromiseChildren =
    propChildren instanceof Promise ||
    (Array.isArray(propChildren) && propChildren.some(child => child instanceof Promise))

  if (hasPromiseAttrs || hasPromiseChildren) {
    hasPromise = true
    currentNode.hasPromises = true

    return enforceAwait(
      (async () => {
        const attrResults = await Promise.allSettled(
          attrsEntries.map(async ([k, v]) => {
            if (typeof v === "boolean") {
              return v ? ` ${k}` : ""
            }
            const valueStr = await stringifyValue(v, true, childContext)
            return ` ${k}="${valueStr}"`
          })
        )

        const attrs = attrResults
          .filter(result => result.status === "fulfilled")
          .map(result => (result as PromiseFulfilledResult<string>).value)
          .filter(Boolean)
          .join("")

        let content = ""

        if (propChildren instanceof Promise) {
          try {
            const resolved = await propChildren
            content = await stringifyValue(resolved, false, childContext)
          } catch {
            content = ""
          }
        } else if (Array.isArray(propChildren)) {
          const resolvedChildren = await Promise.allSettled(
            propChildren.map(child =>
              child instanceof Promise ?
                child.then(r => stringifyValue(r, false, childContext))
              : stringifyValue(child, false, childContext)
            )
          )

          content = resolvedChildren
            .filter(result => result.status === "fulfilled")
            .map(result => (result as PromiseFulfilledResult<string>).value)
            .join("")
        } else {
          content = await stringifyValue(propChildren, false, childContext)
        }

        return formataisx(`<${tag}${attrs}>${content}</${tag}>`)
      })(),
      childContext
    )
  }

  const attrs = attrsEntries
    .map(([k, v]) => {
      if (typeof v === "boolean") {
        return v ? ` ${k}` : ""
      }
      return ` ${k}="${String(v)}"`
    })
    .filter(Boolean)
    .join("")

  const content = propChildren ? String(propChildren) : ""
  return formataisx(`<${tag}${attrs}>${content}</${tag}>`)
}

/**
 * JSX runtime function for arrays
 * @param tag - The tag to render
 * @param props - The props to render
 * @param context - The async context
 * @returns The rendered string or Promise<string>
 */
const jsxs = jsx

export { jsx, jsxs, Fragment }
