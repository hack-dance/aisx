/** @jsxImportSource aiml */
import type { Children } from "../src/jsx-runtime/types"

async function fetchUserData(userId: string): Promise<{ name: string; role: string; id: string }> {
  await new Promise(resolve => setTimeout(resolve, 100))
  return { name: "Jane Doe", role: "Administrator", id: userId }
}

async function UserProfile({ userId }: { userId: string }) {
  const userData = await fetchUserData(userId)

  return (
    <user-profile id={userData.id}>
      <name>{userData.name}</name>
      <role>{userData.role}</role>
    </user-profile>
  )
}

async function AsyncDataAttribute() {
  const role = await Promise.resolve("guest")

  return <user role={role} />
}

function Container({ children }: { children: Children }) {
  return <test-container>{children}</test-container>
}

export async function AsyncExample() {
  return (
    <Container
      children={
        <Fragment>
          <UserProfile userId="123" />
          <AsyncDataAttribute />
          <data-value>{Promise.resolve("This is async content")}</data-value>
        </Fragment>
      }
    />
  )
}
