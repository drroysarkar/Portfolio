import type { Metadata, Viewport } from 'next'
import './globals.css'
import './atlas.css'
import './museum.css'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'Divyanshu Kumar — Full Stack Developer · Atlas Portfolio',
  description:
    'Full stack developer (ASP.NET, SQL Server, React) from Lucknow, India. A next-generation portfolio: a drivable top-down Atlas map of the whole body of work, a walk-through 3D museum of 20 projects, a 31-technology evidence graph, the AttendanceMaster computer-vision case study and an AI assistant that answers questions about him.',
  keywords: ['Divyanshu Kumar', 'Full Stack Developer', 'ASP.NET', 'React', 'SQL Server', 'Computer Vision', 'Portfolio', 'Lucknow'],
  openGraph: { title: 'Divyanshu Kumar — Atlas Portfolio', description: 'Drive the map. Walk the museum. Ask the AI.', type: 'website' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f1ea' },
    { media: '(prefers-color-scheme: dark)', color: '#07080b' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Hanken+Grotesk:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Caveat:wght@500;700&family=Courier+Prime:wght@400;700&display=swap"
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
