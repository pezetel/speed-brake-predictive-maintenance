import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'B737 Speedbrake Predictive Maintenance',
  description: 'B737 NG/MAX Speedbrake Health Monitoring & Predictive Maintenance Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
