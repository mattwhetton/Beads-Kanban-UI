import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'Beads',
  description: 'Kanban interface for beads - git-backed distributed issue tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-background antialiased">
        <div className="flex-1">{children}</div>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
