import { JSXFunction, Fragment } from './types';

import { BasePropsWithChildren, Children } from "./types"

/**
 * TypeScript JSX declarations for aisx
 * This file provides TypeScript with the necessary type information for JSX elements
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
export { Fragment };

export const jsx: JSXFunction;
export const jsxs: JSXFunction;
export const jsxDEV: JSXFunction;



