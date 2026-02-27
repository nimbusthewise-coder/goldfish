import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AppShell } from '@/components/layout/AppShell';
import '@/styles/globals.css';
import '@/styles/layout.css';
import '@/styles/constellation.css';

export const metadata: Metadata = {
  title: 'Goldfish - Thought Constellation',
  description: 'Capture and explore your thoughts as an interconnected constellation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
