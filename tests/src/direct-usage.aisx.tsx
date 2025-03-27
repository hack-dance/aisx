/** @jsxImportSource aisx */
import { describe, expect, test } from "bun:test"

import type { Children } from "aisx"

describe("Direct aisx Usage", () => {
  test("should directly use JSX without render wrapper", async () => {
    const directJsx = <greeting>Hello World</greeting>

    expect(typeof directJsx).toBe("string")
    expect(directJsx).toBe("<greeting>Hello World</greeting>")
  })

  test("should handle fragment direct usage", async () => {
    const fragmentJsx = (
      <>
        <first>First</first>
        <second>Second</second>
      </>
    )

    expect(typeof fragmentJsx).toBe("string")
    expect(fragmentJsx).toBe("<first>First</first><second>Second</second>")
  })

  test("should handle component direct usage", async () => {
    const Component = ({ name }: { name: string }) => <user>{name}</user>

    const result = <Component name="Jane" />
    expect(result).toBe("<user>Jane</user>")
  })

  test("should handle async component direct usage", async () => {
    const AsyncComponent = async ({ id }: { id: string }) => {
      const data = await Promise.resolve(`user-${id}`)
      return <user id={id}>{data}</user>
    }

    const result = await AsyncComponent({ id: "123" })
    expect(result).toBe('<user id="123">user-123</user>')
  })

  test("should handle nested async and sync components directly", async () => {
    const InnerAsync = async ({ value }: { value: string }) => {
      const processed = await Promise.resolve(`Processed ${value}`)
      return <inner>{processed}</inner>
    }

    const Outer = ({ children }: { children: Children }) => <outer>{children}</outer>

    const result = await Outer({ children: await InnerAsync({ value: "test" }) })
    expect(result).toBe("<outer><inner>Processed test</inner></outer>")
  })

  test("should handle promise directly in JSX", async () => {
    const promise = Promise.resolve("async content")

    const element = <wrapper>{promise}</wrapper>

    expect(element instanceof Promise).toBe(true)

    const resolved = await element
    expect(resolved).toBe("<wrapper>async content</wrapper>")
  })

  test("should handle mixed direct and async attribute values", async () => {
    const syncAttr = "sync"
    const asyncAttr = Promise.resolve("async")

    const element = <test-element sync={syncAttr} async={asyncAttr} />
    const resolved = await element

    expect(resolved).toBe('<test-element sync="sync" async="async"></test-element>')
  })
})
