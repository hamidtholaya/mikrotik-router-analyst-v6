import './globals.css';
import Navigation from './components/Navigation';

export const metadata = {
  title: 'MikroTik Manager',
  description: 'Next.js application for MikroTik RouterOS management via node-routeros API',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          {children}
        </main>
        <footer style={{
          padding: '20px 24px',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-dim)',
          borderTop: '1px solid var(--border-color)',
          marginTop: 'auto'
        }}>
          MikroTik Manager &copy; {new Date().getFullYear()} &bull; Connected via <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>node-routeros</code>
        </footer>
      </body>
    </html>
  );
}
