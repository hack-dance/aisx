import Greeting from "./Greeting";

interface LayoutProps {
  title: string;
  username: string;
  items?: string[];
  showDate?: boolean;
}

export default function Layout({ title, username, items = [], showDate = false }: LayoutProps) {
  return (
    <div className="layout">
      <header>
        <h1>{title}</h1>
      </header>
      
      <main>
        <Greeting name={username} showDate={showDate} />
        
        {items.length > 0 && (
          <>
            <h2>Items:</h2>
            <ul>
              {items.map(item => <li key={item}>{item}</li>)}
            </ul>
          </>
        )}
      </main>
      
      <footer>
        <p>© {new Date().getFullYear()} AISX Demo</p>
      </footer>
    </div>
  );
}