import {
  JSXElement,
  JSXElementAttributesProperty,
  JSXElementChildrenAttribute,
  JSXIntrinsicElements
} from "./jsx-runtime/types"

declare global {
  namespace JSX {
    type IntrinsicElements = JSXIntrinsicElements
    type Element = JSXElement
    type ElementAttributesProperty = JSXElementAttributesProperty
    type ElementChildrenAttribute = JSXElementChildrenAttribute
  }
}

export {}
