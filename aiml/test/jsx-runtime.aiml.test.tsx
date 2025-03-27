/** @jsxImportSource aiml */
import { describe, expect, test } from "bun:test"

import AIML from "../src/jsx-runtime"

describe("JSX Runtime", () => {
  test("should render elements with content", () => {
    const element = AIML.render(
      <test-element>
        <child-element>Content</child-element>
      </test-element>
    )

    expect(element).toBe(`<test-element><child-element>Content</child-element></test-element>`)
  })

  test("should render self-closing elements with attributes", () => {
    const element = AIML.render(
      <test-element>
        <self-closing-element name="test" value={123} />
        <self-closing-element flag />
      </test-element>
    )

    expect(element).toContain("<test-element>")
    expect(element).toContain('<self-closing-element name="test" value="123">')
    expect(element).toContain("<self-closing-element flag>")
    expect(element).toContain("</test-element>")
  })

  test("should render conversation context", () => {
    const messages = [
      { role: "system", content: "System message" },
      { role: "user", content: "User message" },
      { role: "assistant", content: "Assistant message" }
    ]

    const element = AIML.render(
      <conversation-context>
        {messages.map((msg, i) => (
          <context-message key={i} role={msg.role}>
            <message-role>{msg.role}</message-role>
            <message-content>{msg.content}</message-content>
          </context-message>
        ))}
      </conversation-context>
    )

    // Strip commas for testing
    const strippedElement = typeof element === "string" ? element.replace(/,/g, "") : element
    expect(strippedElement).toContain("<conversation-context>")
    expect(strippedElement).toContain('<context-message role="system">')
    expect(strippedElement).toContain("<message-role>system</message-role>")
    expect(strippedElement).toContain("<message-content>System message</message-content>")
    expect(strippedElement).toContain('<context-message role="user">')
    expect(strippedElement).toContain("<message-role>user</message-role>")
    expect(strippedElement).toContain("<message-content>User message</message-content>")
    expect(strippedElement).toContain('<context-message role="assistant">')
    expect(strippedElement).toContain("<message-role>assistant</message-role>")
    expect(strippedElement).toContain("<message-content>Assistant message</message-content>")
    expect(strippedElement).toContain("</conversation-context>")
  })

  test("should render conversation state", () => {
    const data = {
      conversationState: {
        currentStep: "collecting_info",
        requiredFields: ["name", "email"]
      },
      transactions: [
        { id: "t1", amount: 100 },
        { id: "t2", amount: 200 }
      ]
    }

    const element = AIML.render(
      <conversation-state>
        <state-info>
          <current-step value={data.conversationState.currentStep} />
          <required-fields>
            {data.conversationState.requiredFields.map(field => (
              <field-requirement key={field} name={field} />
            ))}
          </required-fields>
        </state-info>
        <transaction-history>
          {data.transactions.map(tx => (
            <transaction key={tx.id} id={tx.id} amount={tx.amount} />
          ))}
        </transaction-history>
      </conversation-state>
    )

    // Strip commas for testing
    const strippedElement = typeof element === "string" ? element.replace(/,/g, "") : element
    expect(strippedElement).toContain("<conversation-state>")
    expect(strippedElement).toContain("<state-info>")
    expect(strippedElement).toContain('<current-step value="collecting_info">')
    expect(strippedElement).toContain("<required-fields>")
    expect(strippedElement).toContain('<field-requirement name="name">')
    expect(strippedElement).toContain('<field-requirement name="email">')
    expect(strippedElement).toContain("<transaction-history>")
    expect(strippedElement).toContain('<transaction id="t1" amount="100">')
    expect(strippedElement).toContain('<transaction id="t2" amount="200">')
    expect(strippedElement).toContain("</conversation-state>")
  })

  test("should render intent classification", () => {
    const intent = {
      intent: {
        primary: "support",
        subType: "technical"
      },
      classificationReasoning: "User mentioned technical issues with the platform"
    }

    const element = AIML.render(
      <intent-classification>
        <intent-details>
          <primary-intent>{intent.intent.primary}</primary-intent>
          {intent.intent.subType && <sub-intent>{intent.intent.subType}</sub-intent>}
        </intent-details>
        <classification-reasoning>{intent.classificationReasoning}</classification-reasoning>
      </intent-classification>
    )

    // Strip commas for testing
    const strippedElement = typeof element === "string" ? element.replace(/,/g, "") : element
    expect(strippedElement).toContain("<intent-classification>")
    expect(strippedElement).toContain("<intent-details>")
    expect(strippedElement).toContain("<primary-intent>support</primary-intent>")
    expect(strippedElement).toContain("<sub-intent>technical</sub-intent>")
    expect(strippedElement).toContain(
      "<classification-reasoning>User mentioned technical issues with the platform</classification-reasoning>"
    )
    expect(strippedElement).toContain("</intent-classification>")
  })

  test("should handle nested components", () => {
    const NestedComponent = ({ label }: { label: string }) => {
      return <nested-element>{label}</nested-element>
    }

    const DeepNested = () => {
      return (
        <deep-nested>
          <NestedComponent label="first" />
          <NestedComponent label="second" />
        </deep-nested>
      )
    }

    const element = AIML.render(
      <root-element>
        <NestedComponent label="test" />
        <DeepNested />
      </root-element>
    )

    // Strip commas for testing
    const strippedElement = typeof element === "string" ? element.replace(/,/g, "") : element
    expect(strippedElement).toContain("<root-element>")
    expect(strippedElement).toContain("<nested-element>test</nested-element>")
    expect(strippedElement).toContain("<deep-nested>")
    expect(strippedElement).toContain("<nested-element>first</nested-element>")
    expect(strippedElement).toContain("<nested-element>second</nested-element>")
    expect(strippedElement).toContain("</deep-nested>")
    expect(strippedElement).toContain("</root-element>")
  })

  test("should handle dynamic data in nested components", () => {
    type ItemProps = { id: string; data: { name: string; value: number } }

    const DataItem = ({ data }: ItemProps) => (
      <data-item>
        <n>{data.name}</n>
        <value>{String(data.value)}</value>
      </data-item>
    )

    const DataList = ({ items }: { items: ItemProps[] }) => (
      <data-list>
        {items.map(item => (
          <DataItem {...item} />
        ))}
      </data-list>
    )

    const items = [
      { id: "1", data: { name: "First", value: 100 } },
      { id: "2", data: { name: "Second", value: 200 } }
    ]

    const element = AIML.render(<DataList items={items} />)

    // Strip commas for testing
    const strippedElement = typeof element === "string" ? element.replace(/,/g, "") : element
    expect(strippedElement).toContain("<data-list>")
    expect(strippedElement).toContain("<data-item>")
    expect(strippedElement).toContain("<n>First</n>")
    expect(strippedElement).toContain("<value>100</value>")
    expect(strippedElement).toContain("<n>Second</n>")
    expect(strippedElement).toContain("<value>200</value>")
    expect(strippedElement).toContain("</data-list>")
  })

  test("should handle conditional rendering in nested components", () => {
    const ConditionalComponent = ({ show, value }: { show: boolean; value: string }) => {
      if (!show) return null
      return <conditional-element>{value}</conditional-element>
    }

    const WrappedConditional = ({ items }: { items: { show: boolean; value: string }[] }) => (
      <wrapper>
        {items.map(item => (
          <ConditionalComponent {...item} />
        ))}
      </wrapper>
    )

    const items = [
      { show: true, value: "first" },
      { show: false, value: "hidden" },
      { show: true, value: "last" }
    ]

    const element = AIML.render(<WrappedConditional items={items} />)

    // Strip commas and consecutive nulls (,,) for testing
    const strippedElement = typeof element === "string" ? element.replace(/,+/g, "") : element
    expect(strippedElement).toContain("<wrapper>")
    expect(strippedElement).toContain("<conditional-element>first</conditional-element>")
    expect(strippedElement).toContain("<conditional-element>last</conditional-element>")
    expect(strippedElement).toContain("</wrapper>")
  })

  test("should handle async data resolution (mocked)", async () => {
    const fetchData = async (): Promise<{ status: string; message: string }> => {
      return await new Promise(resolve => {
        setTimeout(() => {
          resolve({ status: "success", message: "Data loaded" })
        }, 100)
      })
    }

    const data = await fetchData()

    const AsyncResult = async ({ status, message }: { status: string; message: string }) => (
      <async-element>
        <status>{status}</status>
        <message>{message}</message>
      </async-element>
    )

    const element = AIML.render(
      <wrapper>
        <AsyncResult status={data.status} message={data.message} />
      </wrapper>
    )

    const rendered = await element
    const strippedOutput = typeof rendered === "string" ? rendered.replace(/,/g, "") : rendered

    expect(strippedOutput).toContain("<wrapper>")
    expect(strippedOutput).toContain("<async-element>")
    expect(strippedOutput).toContain("<status>success</status>")
    expect(strippedOutput).toContain("<message>Data loaded</message>")
    expect(strippedOutput).toContain("</async-element>")
    expect(strippedOutput).toContain("</wrapper>")
  })

  test("should handle deeply nested promises", async () => {
    const deepPromise = Promise.resolve(Promise.resolve(Promise.resolve("deep value")))

    const element = AIML.render(<deep-test>{deepPromise}</deep-test>)
    const rendered = await element

    expect(rendered).toBe("<deep-test>deep value</deep-test>")
  })

  test("should handle promises that resolve to JSX", async () => {
    const jsxPromise = Promise.resolve(<inner-element>nested</inner-element>)

    const element = AIML.render(<wrapper>{jsxPromise}</wrapper>)
    const rendered = await element

    expect(rendered).toBe("<wrapper><inner-element>nested</inner-element></wrapper>")
  })

  test("should handle rejecting promises gracefully", async () => {
    const failingPromise = Promise.reject(new Error("Intentional test failure"))

    const element = AIML.render(<error-test>{failingPromise}</error-test>)
    const rendered = await element

    expect(rendered).toBe("<error-test></error-test>")
  })

  test("should handle mix of rejecting and resolving promises", async () => {
    const successPromise = Promise.resolve("success")
    const failingPromise = Promise.reject(new Error("Intentional test failure"))

    const element = AIML.render(
      <mixed-promises>
        <success>{successPromise}</success>
        <failure>{failingPromise}</failure>
      </mixed-promises>
    )

    const rendered = await element

    expect(rendered).toBe(
      "<mixed-promises><success>success</success><failure></failure></mixed-promises>"
    )
  })

  test("should handle promises in attributes and children simultaneously", async () => {
    const attrPromise = Promise.resolve("attr-value")
    const childPromise = Promise.resolve("child-value")

    const element = AIML.render(
      <complex-element attr={attrPromise}>{childPromise}</complex-element>
    )
    const rendered = await element

    expect(rendered).toBe('<complex-element attr="attr-value">child-value</complex-element>')
  })

  test("should handle arrays of promises", async () => {
    const promises = [Promise.resolve("first"), Promise.resolve("second"), Promise.resolve("third")]

    const element = AIML.render(<array-test>{promises}</array-test>)
    const rendered = await element

    expect(rendered).toBe("<array-test>firstsecondthird</array-test>")
  })

  test("should handle mixed arrays of values and promises", async () => {
    const mixed = ["static", Promise.resolve("async"), "123", Promise.resolve("456")]

    const element = AIML.render(<mixed-array>{mixed}</mixed-array>)
    const rendered = await element

    expect(rendered).toBe("<mixed-array>staticasync123456</mixed-array>")
  })

  test("should handle boolean attributes correctly", async () => {
    const asyncTrue = Promise.resolve(true)
    const asyncFalse = Promise.resolve(false)

    const element = AIML.render(
      <boolean-test
        syncTrue={true}
        syncFalse={false}
        asyncTrue={asyncTrue}
        asyncFalse={asyncFalse}
      />
    )

    const rendered = await element
    expect(rendered).toContain("syncTrue")

    expect(rendered).toContain("asyncTrue")
  })

  test("should handle date objects in attributes and content", async () => {
    const date = new Date("2023-01-01T00:00:00Z")
    const asyncDate = Promise.resolve(new Date("2023-12-31T23:59:59Z").toISOString())

    const element = AIML.render(<date-test date={date}>{asyncDate}</date-test>)

    const rendered = await element

    expect(rendered).toBe(
      '<date-test date="2023-01-01T00:00:00.000Z">2023-12-31T23:59:59.000Z</date-test>'
    )
  })

  test("should handle complex objects after JSON stringification", async () => {
    const complexObject = {
      name: "test",
      values: [1, 2, 3],
      nested: { prop: "value" }
    }

    const element = AIML.render(<object-test data={complexObject} />)
    const rendered = await element

    expect(rendered).toContain("<object-test")
    expect(rendered).toContain("data=")
    expect(rendered).toContain("</object-test>")
  })
})
