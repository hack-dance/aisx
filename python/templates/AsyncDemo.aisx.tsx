interface AsyncDemoProps {
  delay?: number
}

// Simulate an async API call
async function fetchData(delay = 1000) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        message: "Data loaded successfully!",
        timestamp: new Date().toISOString(),
        items: ["Apple", "Banana", "Cherry"]
      })
    }, delay)
  })
}

export default async function AsyncDemo({ delay = 1000 }: AsyncDemoProps) {
  const data = await fetchData(delay)

  return (
    <div className="async-demo">
      <h2>Async Component Demo</h2>
      <p>{data.message}</p>
      <p>Loaded at: {data.timestamp}</p>

      <h3>Items:</h3>
      <ul>
        {data.items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
