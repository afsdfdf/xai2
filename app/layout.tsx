"use client"

import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
// Use the unified error boundary
import { ErrorBoundary } from '@/app/components/ErrorBoundary'
import EthereumProtection from '@/app/components/EthereumProtection'
import { EthereumProtectionScript, LightweightChartsPreloader } from '@/app/head-scripts'
import dynamic from 'next/dynamic'

// 动态导入错误监视器以避免SSR问题
const ChartErrorMonitor = dynamic(
  () => import('@/app/components/ChartErrorMonitor'),
  { ssr: false }
)

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
        <LightweightChartsPreloader />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <EthereumProtection />
          <ErrorBoundary
            filterErrors={(error) => 
              error.message.includes("ethereum") || 
              error.message.includes("[object Object]")
            }
          >
            {children}
          </ErrorBoundary>
          <ChartErrorMonitor />
        </ThemeProvider>
      </body>
    </html>
  )
}

