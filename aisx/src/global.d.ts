import {
  JSXElement,
  JSXElementAttributesProperty,
  JSXElementChildrenAttribute,
  JSXFragment,
  JSXIntrinsicElements,
  Component,
  BaseProps
} from "./jsx-runtime/types"

declare global {
  namespace JSX {
    type IntrinsicElements = JSXIntrinsicElements
    type Element = JSXElement
    type ElementAttributesProperty = JSXElementAttributesProperty
    type ElementChildrenAttribute = JSXElementChildrenAttribute
    type Fragment = string | Component<BaseProps>
  }
}

export {}
