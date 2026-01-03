import type { Metadata } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
const siteName = 'MillionCXO Dashboard';

export const defaultMetadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: 'MillionCXO Client Management Portal - Manage clients, SDRs, assignments, invoices, and reports all in one place.',
  keywords: [
    'MillionCXO',
    'Client Management Portal',
    'Client Management',
    'CRM',
    'Customer Relationship Management',
    'Dashboard',
    'SDR Management',
    'Sales Dashboard',
    'Business Management',
    'Client Portal',
  ],
  authors: [{ name: 'MillionCXO' }],
  creator: 'MillionCXO',
  publisher: 'MillionCXO',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    title: siteName,
    description: 'MillionCXO Client Management Portal - Manage clients, SDRs, assignments, invoices, and reports all in one place.',
    siteName,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: 'MillionCXO Client Management Portal - Manage clients, SDRs, assignments, invoices, and reports all in one place.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0B2E2B' },
    { media: '(prefers-color-scheme: dark)', color: '#0B2E2B' },
  ],
  category: 'Business',
  classification: 'Business Application',
};

export function createPageMetadata(
  title: string,
  description?: string,
  path?: string
): Metadata {
  const pageDescription = description || (typeof defaultMetadata.description === 'string' ? defaultMetadata.description : 'MillionCXO Dashboard');
  
  return {
    title,
    description: pageDescription,
    openGraph: {
      ...defaultMetadata.openGraph,
      title,
      description: pageDescription,
      url: path ? `${baseUrl}${path}` : baseUrl,
    },
    twitter: {
      ...defaultMetadata.twitter,
      title,
      description: pageDescription,
    },
    alternates: {
      canonical: path || '/',
    },
  };
}

