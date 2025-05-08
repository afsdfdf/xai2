"use client"

import ChartDiagnostic from "@/app/components/ChartDiagnostic"

export default function DiagnosticsPage() {
  return (
    <div className="flex flex-col bg-gray-900 min-h-screen">
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">图表诊断页面</h1>
        <p className="text-gray-400">用于测试和诊断图表组件</p>
      </div>
      
      <div className="flex-1 p-4">
        <ChartDiagnostic />
      </div>
    </div>
  )
} 