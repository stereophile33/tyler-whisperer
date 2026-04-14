export const metadata = { title: 'The Tyler Whisperer', description: 'PayClearly · Interopay · Confidential' };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0d0d0d' }}>{children}</body>
    </html>
  );
}
