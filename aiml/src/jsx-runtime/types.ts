/**
 * Core type definitions for AIML
 */

/**
 * Base Props definition
 */
export interface BaseProps {
  [key: string]: unknown
  children?: unknown

  // Standard JSX props
  key?: string | number
  ref?: unknown
}

/**
 * Typed Base Props definition
 */
export type TypedBaseProps<T extends Record<string, unknown> = Record<string, never>> = T & {
  [key: string]: unknown
  children?: unknown

  // Standard JSX props
  key?: string | number
  ref?: unknown
}

/**
 * Component type definition
 */
export type Component<P extends BaseProps = BaseProps> = (props: P) => string | Promise<string>

/**
 * Children type definition
 */
export type Children =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<Children>
  | Component<BaseProps>
  | Promise<string>

/**
 * Base Props with Children definition
 */
export interface BasePropsWithChildren extends BaseProps {
  children?: Children
}

/**
 * JSX function type definition
 */
export type JSXFunction = <P extends BaseProps>(
  tag: string | Component<P>,
  props: P | null,
  ...children: unknown[]
) => Promise<string> | string

/**
 * Fragment symbol for JSX fragments
 */
export const Fragment = Symbol("Fragment")

/**
 * Renders a JSX element to a string
 */
export function render(element: unknown): Promise<string> | string {
  if (typeof element === "string") {
    return element
  }
  if (element instanceof Promise) {
    return element
  }
  // Implementation will be provided in runtime
  return ""
}

/**
 * JSX type definitions
 * These will be used to generate the global.d.ts file
 */
export interface JSXIntrinsicElements {
  [elemName: string]: BasePropsWithChildren
}

export type JSXElement = string | Promise<string>

export interface JSXElementAttributesProperty {
  props: Record<string, unknown>
}

export interface JSXElementChildrenAttribute {
  children: Children
}
