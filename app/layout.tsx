import type { Metadata } from 'next'
// Self-hosted Inter (no build-time Google Fonts fetch). @fontsource ships the
// font files in node_modules, so the build has zero network dependency.
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'frontEnd2.0',
  description: 'Enterprise Application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline script runs before paint to prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme') || 'light';
              if (theme === 'dark') {
                document.documentElement.classList.add('dark');
              } else if (theme === 'system') {
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.classList.add('dark');
                }
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="font-inter">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
