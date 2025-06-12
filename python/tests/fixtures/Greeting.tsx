interface GreetingProps {
  name: string
}

export default function Greeting({ name }: GreetingProps) {
  return (
    <div className="greeting">
      <h1>Hello {name}!</h1>
      <p>Welcome to AISX</p>
    </div>
  )
}
