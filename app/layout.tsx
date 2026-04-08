import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'B737 Speedbrake Anomaly Analysis',
  description: 'B737 NG & MAX Speedbrake fault detection dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
