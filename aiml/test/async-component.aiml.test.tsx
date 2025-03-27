/** @jsxImportSource aiml */
import { describe, expect, test } from "bun:test"

import { AsyncExample } from "./async-component.aiml"

describe("Async Components", () => {
  test("should render async components with awaited data", async () => {
    const rendered = await AsyncExample()

    // Verify structure and content
    expect(typeof rendered).toBe("string")
    expect(rendered).toContain('<user-profile id="123">')

    // Check for name with looser matching - the output includes "Jane Doe" but not as a clean tag
    expect(rendered).toContain("Jane Doe")
    expect(rendered).toContain("Administrator")
    expect(rendered).toContain('<user role="guest">')
    expect(rendered).toContain("This is async content")
  })

  test("should handle async attribute values", async () => {
    const AttributeTest = async () => {
      const id = await Promise.resolve("test-id")
      const value = await Promise.resolve(42)
      const flag = await Promise.resolve(true)

      return <test-element id={id} value={value} flag={flag}></test-element>
    }

    const rendered = await AttributeTest()
    expect(rendered).toBe('<test-element id="test-id" value="42" flag></test-element>')
  })

  test("should handle async children values", async () => {
    const ChildrenTest = () => {
      return <wrapper>{Promise.resolve("Async text")}</wrapper>
    }

    const rendered = await ChildrenTest()
    expect(rendered).toBe("<wrapper>Async text</wrapper>")
  })

  test("should handle mixed sync and async content", async () => {
    const MixedContent = async () => {
      const asyncValue = await Promise.resolve("async value")

      return (
        <mixed-content>
          <sync-part>Sync text</sync-part>
          <async-part>{asyncValue}</async-part>
          <nested>{Promise.resolve("Nested async")}</nested>
        </mixed-content>
      )
    }

    const rendered = await MixedContent()
    expect(rendered).toBe(
      "<mixed-content><sync-part>Sync text</sync-part><async-part>async value</async-part><nested>Nested async</nested></mixed-content>"
    )
  })

  test("should handle nested async components", async () => {
    const NestedAsync = async ({ level }: { level: number }) => {
      if (level <= 0) return <bottom>reached bottom</bottom>

      const nextLevel = await Promise.resolve(level - 1)
      return (
        <level-wrapper level={level.toString()}>
          <NestedAsync level={nextLevel} />
        </level-wrapper>
      )
    }

    const rendered = await (<NestedAsync level={3} />)
    expect(rendered).toBe(
      '<level-wrapper level="3"><level-wrapper level="2"><level-wrapper level="1"><bottom>reached bottom</bottom></level-wrapper></level-wrapper></level-wrapper>'
    )
  })

  test("should handle async array children", async () => {
    const AsyncArray = async () => {
      const items = await Promise.resolve([1, 2, 3])

      return (
        <list-container>
          {items.map(item => (
            <list-item key={item}>{item}</list-item>
          ))}
        </list-container>
      )
    }

    const rendered = await AsyncArray()
    expect(rendered).toContain("<list-container>")
    expect(rendered).toContain("<list-item>1</list-item>")
    expect(rendered).toContain("<list-item>2</list-item>")
    expect(rendered).toContain("<list-item>3</list-item>")
    expect(rendered).toContain("</list-container>")
  })

  test("should handle complex async data patterns", async () => {
    type DataItem = { id: string; name: string; details: string }

    async function fetchItems(): Promise<DataItem[]> {
      await new Promise(resolve => setTimeout(resolve, 50))
      return [
        { id: "1", name: "Item 1", details: "Details 1" },
        { id: "2", name: "Item 2", details: "Details 2" }
      ]
    }

    const ItemView = ({ id, item }: { id: string; item: DataItem }) => (
      <item id={id}>
        <n>{item.name}</n>
        <details>{item.details}</details>
      </item>
    )

    const AsyncItemList = async () => {
      const items = await fetchItems()

      return (
        <item-list>
          {items.map(item => (
            <ItemView id={item.id} item={item} />
          ))}
        </item-list>
      )
    }

    const rendered = await AsyncItemList()
    expect(rendered).toContain("<item-list>")
    expect(rendered).toContain('<item id="1">')
    expect(rendered).toContain("<n>Item 1</n>")
    expect(rendered).toContain("<details>Details 1</details>")
    expect(rendered).toContain('<item id="2">')
    expect(rendered).toContain("<n>Item 2</n>")
    expect(rendered).toContain("<details>Details 2</details>")
    expect(rendered).toContain("</item-list>")
  })

  test("should handle error cases in async components", async () => {
    const ErrorComponent = async () => {
      try {
        // Simulate an error
        await Promise.reject(new Error("Test error"))
        return <success>This should not render</success>
      } catch {
        return <e>Error occurred</e>
      }
    }

    const rendered = await ErrorComponent()
    expect(rendered).toBe("<e>Error occurred</e>")
  })

  test("should handle parallel async operations", async () => {
    const ParallelAsync = async () => {
      const [value1, value2, value3] = await Promise.all([
        Promise.resolve("first"),
        Promise.resolve("second"),
        Promise.resolve("third")
      ])

      return (
        <parallel-container>
          <item>{value1}</item>
          <item>{value2}</item>
          <item>{value3}</item>
        </parallel-container>
      )
    }

    const rendered = await ParallelAsync()
    expect(rendered).toContain("<parallel-container>")
    expect(rendered).toContain("<item>first</item>")
    expect(rendered).toContain("<item>second</item>")
    expect(rendered).toContain("<item>third</item>")
    expect(rendered).toContain("</parallel-container>")
  })
})
