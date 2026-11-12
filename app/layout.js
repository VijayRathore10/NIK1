import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSiteSettings } from '@/lib/data';
import { Inter, Barlow_Condensed, IBM_Plex_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const barlowCondensed = Barlow_Condensed({
  weight: ['500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-barlow-condensed',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ibm-plex-mono',
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Nik Exports | Commercial Vehicles & Equipment Export',
  description:
    'Nik Exports — Commercial vehicles & equipment export portal for trucks, buses, machinery, and special application vehicles.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};


export default async function RootLayout({ children }) {
  const settings = await getSiteSettings();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${barlowCondensed.variable} ${ibmPlexMono.variable}`}
    >
      <body className="antialiased min-h-screen flex flex-col bg-[#F3F1EA] text-[#1A1F26]" suppressHydrationWarning>
        <Header settings={settings} />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} />
      </body>
    </html>
  );
}
