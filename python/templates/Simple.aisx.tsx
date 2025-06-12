export default function Simple(props: { message: string }) {
  return (
    <div className="simple">
      <h1>Simple Template</h1>
      <p>{props.message}</p>
      <p>Current time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}