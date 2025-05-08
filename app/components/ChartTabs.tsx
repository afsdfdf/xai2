"use client"

import { useState } from "react"

interface ChartTabsProps {
  darkMode: boolean
  selectedIndicator: string
  onIndicatorChange: (indicator: string) => void
}

export default function ChartTabs({ darkMode, selectedIndicator, onIndicatorChange }: ChartTabsProps) {
  const tabs = ["MA", "EMA", "BOLL", "VOL", "MACD", "KDJ", "RSI"]
  
  return (
    <div className="flex overflow-x-auto py-2 bg-gray-800 hide-scrollbar">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`px-4 py-1 mx-1 whitespace-nowrap text-sm ${
            selectedIndicator === tab
              ? "text-blue-500"
              : "text-gray-400"
          }`}
          onClick={() => onIndicatorChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}