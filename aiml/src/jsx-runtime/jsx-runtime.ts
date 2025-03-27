import type { BaseProps, BasePropsWithChildren, Component } from "./types"

const stringifyValue = async (value: unknown, isAttribute = false): Promise<string> => {
  if (value instanceof Promise) {
    try {
      const resolvedValue = await value
      return stringifyValue(resolvedValue, isAttribute)
    } catch {
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
      } catch {
        return ""
      }
    }

    return ""
  }

  if (Array.isArray(value)) {
    const results = await Promise.all(value.map(v => stringifyValue(v, isAttribute)))
    return results.filter(Boolean).join("")
  }

  if (!isAttribute && typeof value === "boolean") {
    return ""
  }

  if (typeof value === "function") {
    try {
      const functionResult = (value as () => unknown)()
      return stringifyValue(functionResult, isAttribute)
    } catch {
      return ""
    }
  }

  return String(value as string | number | boolean | bigint | symbol)
}

const formatAiml = (str: string) => {
  return str
    .trim()
    .replace(/>\s*,\s*</g, "><")
    .replace(/,\s*</g, "<")
    .replace(/>\s*,/g, ">")
    .replace(/\s+/g, " ")
    .replace(/\s+>/g, ">")
    .replace(/>\s+/g, ">")
    .replace(/\s+</g, "<")
}

const Fragment = "Fragment"
const RESERVED_PROPS = new Set(["key", "ref", "children"])

function jsx<P extends BaseProps>(
  tag: string | Component<P>,
  props: P | null
): string | Promise<string> {
  let hasPromise = false
  let result: string | Promise<string>

  if (typeof tag === "function") {
    result = tag(props as P)
    hasPromise = result instanceof Promise

    if (!hasPromise) {
      return result as string
    }

    return (async () => {
      return await stringifyValue(result)
    })()
  }

  if (tag === Fragment) {
    const { children } = (props ?? {}) as BasePropsWithChildren

    if (children instanceof Promise) {
      return (async () => {
        const childrenStr = await stringifyValue(children)
        return formatAiml(childrenStr)
      })()
    }

    if (Array.isArray(children) && children.some(child => child instanceof Promise)) {
      return (async () => {
        const childrenStr = await stringifyValue(children)
        return formatAiml(childrenStr)
      })()
    }

    try {
      if (Array.isArray(children)) {
        const childrenStr = children.map(String).join("")
        return formatAiml(childrenStr)
      }

      const syncChildrenStr = String(children ?? "")
      return formatAiml(syncChildrenStr)
    } catch {
      return (async () => {
        const childrenStr = await stringifyValue(children)
        return formatAiml(childrenStr)
      })()
    }
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

  if (!hasPromiseAttrs && !hasPromiseChildren) {
    try {
      const syncAttrs = attrsEntries
        .map(([k, v]) => {
          if (typeof v === "boolean") {
            return v ? ` ${k}` : ""
          }
          return ` ${k}="${String(v)}"`
        })
        .filter(Boolean)
        .join("")

      let syncContent = ""
      if (Array.isArray(propChildren)) {
        syncContent = propChildren.map(child => String(child ?? "")).join("")
      } else {
        syncContent = propChildren ? String(propChildren) : ""
      }

      return formatAiml(`<${tag}${syncAttrs}>${syncContent}</${tag}>`)
    } catch {
      hasPromise = true
    }
  } else {
    hasPromise = true
  }

  if (hasPromise) {
    return (async () => {
      const attrResults = await Promise.all(
        attrsEntries.map(async ([k, v]) => {
          if (typeof v === "boolean") {
            return v ? ` ${k}` : ""
          }
          const valueStr = await stringifyValue(v, true)
          return ` ${k}="${valueStr}"`
        })
      )

      const attrs = attrResults.filter(Boolean).join("")
      const content = propChildren ? await stringifyValue(propChildren) : ""

      return formatAiml(`<${tag}${attrs}>${content}</${tag}>`)
    })()
  }

  return ""
}

const jsxs = jsx

export { jsx, jsxs, Fragment }
