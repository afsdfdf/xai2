"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { OptimizedImage } from "@/app/components/ui/optimized-image"
import BottomNav from "@/app/components/BottomNav"
import TokenRankings from "@/app/components/token-rankings"
import EthereumProtection from "../components/EthereumProtection"

export default function MarketPage() {
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(true)

  return (
    <div className={`min-h-screen ${darkMode ? "bg-[#0b101a] text-white" : "bg-gray-50 text-gray-900"} pb-16`}>
      <EthereumProtection />
      <div className="max-w-md mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full p-1">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            <h1 className="text-xl font-bold">市场</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="rounded-full">
              <Moon className="w-5 h-5" />
                </Button>
            <div className="relative w-8 h-8 rounded-full overflow-hidden">
              <OptimizedImage 
                src="/LOGO.JPG" 
                alt="Logo" 
                fill 
                className="object-cover"
                priority
                debug={true}
                useStaticFallback={true}
              />
            </div>
          </div>
        </div>

        {/* 代币主题模块 */}
        <div className="p-4">
          <TokenRankings darkMode={darkMode} />
        </div>

        {/* 底部导航 */}
        <BottomNav darkMode={darkMode} />
      </div>
    </div>
  )
} 