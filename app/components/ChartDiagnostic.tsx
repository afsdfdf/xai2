"use client"

import React, { useEffect, useRef, useState } from 'react'

// Define an interface for the click parameter
interface ChartClickEvent {
  time?: string | number;
  point?: {
    x: number;
    y: number;
  };
  seriesPrices?: Map<any, any>;
  dataIndex?: number;
}

export default function ChartDiagnostic() {
  const [logs, setLogs] = useState<string[]>([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().substr(11, 8)}: ${message}`]);
  };
  
  // Load the Lightweight Charts library
  useEffect(() => {
    addLog('开始诊断流程...');
    
    // Check if already loaded
    if (window.LightweightCharts) {
      addLog('✅ Lightweight Charts 库已存在于 window 对象中');
      setScriptLoaded(true);
      return;
    }
    
    if (document.getElementById('lightweight-charts-script')) {
      addLog('⚠️ 脚本标签已存在，但 window.LightweightCharts 不存在');
      // Continue loading as the previous attempt might have failed
    }
    
    addLog('加载 Lightweight Charts 库...');
    const script = document.createElement('script');
    script.id = 'lightweight-charts-script';
    script.src = 'https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js';
    script.async = true;
    
    script.onload = () => {
      addLog('✅ 脚本加载成功');
      
      if (window.LightweightCharts) {
        addLog(`✅ window.LightweightCharts 对象存在，版本: ${window.LightweightCharts.version || '未知'}`);
        addLog(`✅ createChart 函数: ${typeof window.LightweightCharts.createChart}`);
        setScriptLoaded(true);
      } else {
        addLog('❌ 脚本加载完成但 window.LightweightCharts 对象不存在');
      }
    };
    
    script.onerror = () => {
      addLog('❌ 脚本加载失败');
    };
    
    document.head.appendChild(script);
    
    addLog('已将脚本标签添加到页面');
    
    return () => {
      addLog('组件卸载');
    };
  }, []);
  
  // Try to create a simple chart
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current) {
      return;
    }
    
    try {
      addLog('尝试创建测试图表...');
      
      if (!window.LightweightCharts) {
        addLog('❌ 无法创建图表: window.LightweightCharts 不存在');
        return;
      }
      
      const { createChart } = window.LightweightCharts;
      
      if (typeof createChart !== 'function') {
        addLog(`❌ createChart 不是函数，而是 ${typeof createChart}`);
        return;
      }
      
      addLog(`容器尺寸: ${containerRef.current.clientWidth}x${containerRef.current.clientHeight}`);
      
      // Create chart
      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: 300,
        layout: {
          background: { type: 'solid', color: '#1E222D' },
          textColor: '#d9d9d9',
        },
      });
      
      if (!chart) {
        addLog('❌ 创建图表失败: createChart 返回空值');
        return;
      }
      
      addLog(`✅ 图表创建成功，方法: ${Object.keys(chart).join(', ')}`);
      
      // Create a line series
      if (typeof chart.addLineSeries !== 'function') {
        addLog('❌ chart.addLineSeries 方法不存在');
        return;
      }
      
      const lineSeries = chart.addLineSeries({
        color: '#2962FF',
        lineWidth: 2,
      });
      
      addLog('✅ 线图系列创建成功');
      
      // Add data
      const data = [
        { time: '2023-01-01', value: 10 },
        { time: '2023-01-02', value: 12 },
        { time: '2023-01-03', value: 11 },
        { time: '2023-01-04', value: 15 },
        { time: '2023-01-05', value: 14 },
      ];
      
      lineSeries.setData(data);
      addLog('✅ 数据设置成功');
      
      // Fit content
      chart.timeScale().fitContent();
      addLog('✅ 图表内容适配成功');
      
      // Store reference
      chartInstance.current = chart;
      
      // Add click handler to demonstrate interactivity
      chart.subscribeClick((param: ChartClickEvent) => {
        if (param.time) {
          addLog(`点击了图表: 时间=${param.time}, 价格=${param.point?.y.toFixed(2)}`);
        }
      });
      
      addLog('✅ 测试图表创建完成');
    } catch (err) {
      addLog(`❌ 创建图表时发生错误: ${err instanceof Error ? err.message : String(err)}`);
      console.error('图表创建失败:', err);
    }
  }, [scriptLoaded]);
  
  const clearChart = () => {
    try {
      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
        addLog('清除了现有图表');
      }
    } catch (err) {
      addLog(`清除图表时出错: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  const reloadLibrary = () => {
    try {
      // Remove existing script
      const existingScript = document.getElementById('lightweight-charts-script');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
        addLog('移除了现有脚本标签');
      }
      
      // Reset state
      setScriptLoaded(false);
      clearChart();
      
      // Clear the window object
      (window as any).LightweightCharts = undefined;
      addLog('重置window.LightweightCharts');
      
      // The first useEffect will trigger again and reload the script
    } catch (err) {
      addLog(`重载库时出错: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  return (
    <div className="flex flex-col p-4 bg-gray-900 text-white h-full w-full">
      <h2 className="text-xl font-bold mb-4">图表诊断工具</h2>
      
      <div className="flex space-x-4 mb-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={reloadLibrary}
        >
          重新加载库
        </button>
        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={clearChart}
        >
          清除图表
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        <div 
          ref={containerRef} 
          className="h-[300px] bg-[#1E222D] border border-gray-700 rounded"
        ></div>
        
        <div className="bg-gray-800 p-2 rounded border border-gray-700 overflow-y-auto max-h-[300px]">
          <h3 className="font-semibold mb-2">诊断日志</h3>
          <div className="space-y-1 text-sm font-mono">
            {logs.map((log, index) => (
              <div key={index} className="leading-tight">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 