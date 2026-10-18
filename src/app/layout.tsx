import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'OmniConvert | Unlimited Free In-Browser File Converter (No Ads, No Sign-Up)',
  description:
    'The zero-nonsense file converter. Convert MP4 to MP3, Images to PDF, WebP to PNG, and more. 100% private in-browser processing, no file size limits, and zero sign-ups.',
  keywords: [
    'file converter',
    'mp4 to mp3',
    'images to pdf',
    'jpg to pdf',
    'png to pdf',
    'svg to png',
    'free converter',
    'no limit converter',
    'private converter',
    'client side converter',
  ],
  authors: [{ name: 'OmniConvert Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main style={{ minHeight: 'calc(100vh - 72px - 280px)' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
