/**
 * Render Node definition
 */
export interface RenderNode {
  name: string
  isAsync: boolean
  depth: number
  children: Children
  childNodes: RenderNode[]
  props?: Record<string, unknown> | null
  hasPromises?: boolean
  parent?: RenderNode
}

/**
 * Async context tracking
 * @property isRoot - Whether the current render is the root of the component tree
 * @property parentIsAsync - Whether the parent component is async
 * @property depth - The depth of the current render in the component tree
 */
export interface AsyncContext {
  isRoot?: boolean
  parentIsAsync?: boolean
  depth?: number
}

/**
 * Render Tree Context definition
 */
export interface RenderTreeContext extends AsyncContext {
  tree?: RenderNode
  parent?: RenderNode
}

/**
 * Base Props definition
 */
export interface BaseProps {
  [key: string]: unknown
  children?: Children

  // Standard JSX props
  key?: string | number
  ref?: unknown
}

/**
 * Typed Base Props definition
 */
export type TypedBaseProps<T extends Record<string, unknown> = Record<string, never>> = T & {
  [key: string]: unknown
  children?: Children

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
export type Child =
  | string
  | number
  | boolean
  | null
  | undefined
  | Component<BaseProps>
  | Promise<string>
  | Child[] // Allow arrays as valid children

export type Children = Child | Child[]

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
  context?: AsyncContext,
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

// Define JSX Element type alias for export
export type JSXElement = string | Promise<string>
