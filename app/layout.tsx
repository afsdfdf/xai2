"use client"

import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import ClientErrorBoundary from '@/app/components/client-error-boundary'
import EthereumProtection from '@/app/components/EthereumProtection'
import { EthereumProtectionScript } from '@/app/head-scripts'

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/LOGO.JPG" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta httpEquiv="Content-Security-Policy" content="frame-ancestors 'self'" />
        <EthereumProtectionScript />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <EthereumProtection />
          <ClientErrorBoundary>
          {children}
          </ClientErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  )
}
