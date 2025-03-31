import {
  JSXElement,
  JSXElementAttributesProperty,
  JSXElementChildrenAttribute,
  JSXFragment,
  JSXIntrinsicElements,
  Component,
  BaseProps,
  BasePropsWithChildren,
  Children
} from "./jsx-runtime/types"

/**
 * Global TypeScript JSX declarations for aisx
 * This file provides TypeScript with the necessary type information for JSX elements
 * when aisx is used in other projects
 */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: BasePropsWithChildren
    }
    
    type Element = string | Promise<string>
    
    interface ElementAttributesProperty {
      props: Record<string, unknown>
    }
    
    interface ElementChildrenAttribute {
      children?: Children
    }
  }
}

export {}
