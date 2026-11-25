import './globals.css';
import { Inter, Barlow_Condensed, IBM_Plex_Mono } from 'next/font/google';
import { getSiteBaseUrl } from '@/lib/validation';

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

const siteUrl = getSiteBaseUrl();

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'NIK EXPORTS | Commercial Vehicles & Equipment Export',
    template: '%s | NIK EXPORTS',
  },
  description:
    'NIK EXPORTS — Commercial vehicles & equipment export portal for trucks, buses, machinery, and special application vehicles shipped worldwide.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'NIK EXPORTS',
    title: 'NIK EXPORTS | Commercial Vehicles & Equipment Export',
    description:
      'Commercial vehicles & equipment export portal for trucks, buses, machinery, and special application vehicles shipped worldwide.',
    url: siteUrl,
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'NIK EXPORTS — Commercial Vehicles & Equipment Export',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NIK EXPORTS | Commercial Vehicles & Equipment Export',
    description:
      'Commercial vehicles & equipment export portal for trucks, buses, machinery, and special application vehicles shipped worldwide.',
    images: ['/logo.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${barlowCondensed.variable} ${ibmPlexMono.variable}`}
    >
      <body
        className="antialiased min-h-screen flex flex-col bg-[#F3F1EA] text-[#1A1F26]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
