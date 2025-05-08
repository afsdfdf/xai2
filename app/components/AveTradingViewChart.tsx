"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { getTokenKlineData } from "@/app/lib/ave-api-service"
import { RefreshCw, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'

// LightweightCharts 库接口
declare global {
  interface Window {
    LightweightCharts: any;
  }
}

interface KLineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 添加公开的ref类型，用于父组件访问内部方法
export interface AveTradingViewChartRef {
  changeInterval: (interval: string) => void;
  refresh: () => void;
}

interface AveTradingViewChartProps {
  tokenAddress: string;
  tokenChain: string;
  interval?: string;
  theme?: 'light' | 'dark';
  onRefresh?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  onError?: (error: string | null) => void;
  onIntervalChange?: (interval: string) => void;
  chartRef?: React.RefObject<AveTradingViewChartRef | null>; // ref引用
  autoRefresh?: boolean; // 是否启用自动刷新
  refreshInterval?: number; // 刷新间隔，单位毫秒
}

// 导出可用的时间范围选项，让父组件可以直接使用
export const TIME_INTERVALS = [
  { label: '1分', value: '1m' },
  { label: '5分', value: '5m' },
  { label: '15分', value: '15m' },
  { label: '1时', value: '1h' },
  { label: '4时', value: '4h' },
  { label: '1天', value: '1d' },
  { label: '1周', value: '1w' },
];

export default function AveTradingViewChart({
  tokenAddress,
  tokenChain,
  interval = "1h",
  theme = "dark",
  onRefresh,
  onLoadingChange,
  onError,
  onIntervalChange,
  chartRef,
  autoRefresh = true, // 默认启用自动刷新
  refreshInterval = 60000 // 默认60秒刷新一次
}: AveTradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const [klineData, setKlineData] = useState<KLineData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const chartId = useRef(`chart_${Math.random().toString(36).substring(2, 9)}`);
  const [page, setPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const pageSize = 100; // 每页数据量
  const [currentInterval, setCurrentInterval] = useState(interval);
  
  // 更新当前时间间隔
  useEffect(() => {
    setCurrentInterval(interval);
  }, [interval]);
  
  // 获取K线数据
  const fetchKlineData = useCallback(async (pageNum = 0, append = false) => {
    if (!tokenAddress || !tokenChain) {
      const errorMsg = "缺少代币地址或区块链参数";
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }
    
    if (!append) {
      setIsLoading(true);
      if (onLoadingChange) onLoadingChange(true);
    }
    
    setError(null);
    if (onError) onError(null);
    
    try {
      console.log(`从AVE API获取K线数据: ${tokenAddress} (${tokenChain}), 周期: ${currentInterval}, 页: ${pageNum}`);
      
      const result = await getTokenKlineData(tokenAddress, tokenChain, currentInterval, pageSize, pageNum * pageSize);
      
      if (Array.isArray(result) && result.length > 0) {
        console.log(`成功获取 ${result.length} 个K线数据点`);
        
        // 确保数据格式正确
        const formattedData = result.map(item => {
          // 对时间戳进行正确的处理
          let timestamp = item.time;
          if (typeof timestamp === 'string') {
            // 尝试将字符串转为数字
            timestamp = parseInt(timestamp, 10);
          }
          
          // 确保时间戳是有效的
          if (isNaN(timestamp) || timestamp <= 0) {
            console.warn('检测到无效时间戳:', item.time);
            // 使用当前时间作为回退
            timestamp = Math.floor(Date.now() / 1000);
          }
          
          return {
            time: timestamp,
            open: typeof item.open === 'string' ? parseFloat(item.open) : item.open,
            high: typeof item.high === 'string' ? parseFloat(item.high) : item.high,
            low: typeof item.low === 'string' ? parseFloat(item.low) : item.low,
            close: typeof item.close === 'string' ? parseFloat(item.close) : item.close,
            volume: typeof item.volume === 'string' ? parseFloat(item.volume) : item.volume
          };
        });
        
        setHasMoreData(result.length === pageSize);
        
        if (append) {
          // 如果是加载更多，则追加到现有数据
          setKlineData(prev => {
            // 确保数据按时间排序
            const combined = [...prev, ...formattedData];
            combined.sort((a, b) => a.time - b.time);
            // 移除重复数据
            const uniqueData = combined.filter((item, index, self) =>
              index === 0 || item.time !== self[index - 1].time
            );
            return uniqueData;
          });
        } else {
          // 如果是初始加载或刷新，则替换现有数据
          setKlineData(formattedData);
        }
        
        // 更新页码
        setPage(pageNum);
      } else {
        console.warn("API返回空数据");
        if (pageNum > 0) {
          setHasMoreData(false);
        } else {
          setError("没有可用的K线数据");
          if (onError) onError("没有可用的K线数据");
        }
      }
    } catch (err) {
      console.error("获取K线数据失败:", err);
      const errorMsg = err instanceof Error ? err.message : "获取数据失败";
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      if (!append) {
        setIsLoading(false);
        if (onLoadingChange) onLoadingChange(false);
      }
    }
  }, [tokenAddress, tokenChain, currentInterval, onLoadingChange, onError, pageSize]);
  
  // 切换时间间隔 - 改为公开方法
  const handleIntervalChange = useCallback((newInterval: string) => {
    if (newInterval === currentInterval) return;
    
    console.log(`切换时间间隔: ${currentInterval} -> ${newInterval}`);
    setCurrentInterval(newInterval);
    // 重置页码和数据
    setPage(0);
    setKlineData([]);
    
    // 通知父组件
    if (onIntervalChange) {
      onIntervalChange(newInterval);
    }
  }, [currentInterval, onIntervalChange]);
  
  // 将方法暴露给父组件
  useEffect(() => {
    if (chartRef && 'current' in chartRef) {
      chartRef.current = {
        changeInterval: handleIntervalChange,
        refresh: () => fetchKlineData(0, false)
      };
    }
  }, [handleIntervalChange, fetchKlineData, chartRef]);
  
  // 加载更多历史数据
  const loadMoreHistory = useCallback(() => {
    if (!hasMoreData) return;
    
    const nextPage = page + 1;
    fetchKlineData(nextPage, true);
  }, [fetchKlineData, page, hasMoreData]);
  
  // 初始获取数据
  useEffect(() => {
    fetchKlineData(0, false);
  }, [fetchKlineData, currentInterval]);
  
  // 直接从CDN导入脚本到HTML中
  useEffect(() => {
    // 如果我们已经有脚本标签但window对象中没有库，先移除标签再重试
    const existingScript = document.getElementById('lightweight-charts-script');
    if (existingScript && !window.LightweightCharts) {
      console.log('发现无效的脚本标签，正在移除...');
      existingScript.parentNode?.removeChild(existingScript);
    }
    
    // 如果已经加载，则直接设置状态
    if (window.LightweightCharts) {
      console.log('Lightweight Charts 库已存在于window对象中');
      setScriptLoaded(true);
      return;
    }
    
    console.log('开始加载 Lightweight Charts 库...');
    const script = document.createElement('script');
    script.id = 'lightweight-charts-script';
    // 使用特定版本以避免版本兼容性问题
    script.src = 'https://unpkg.com/lightweight-charts@4.0.1/dist/lightweight-charts.standalone.production.js';
    script.crossOrigin = 'anonymous';
    script.async = false; // 使用同步加载以确保加载顺序
    script.onload = () => {
      console.log('Lightweight Charts 库加载完成');
      if (window.LightweightCharts) {
        console.log('验证: window.LightweightCharts 对象存在');
        console.log('LightweightCharts 版本:', window.LightweightCharts.version);
        console.log('createChart 函数存在:', typeof window.LightweightCharts.createChart === 'function');
        setScriptLoaded(true);
      } else {
        console.error('错误: 脚本加载但 window.LightweightCharts 对象不存在');
        setError('图表库加载异常，请刷新页面重试');
      }
    };
    script.onerror = (e) => {
      console.error('Lightweight Charts 库加载失败:', e);
      const errorMsg = '图表库加载失败，请检查网络连接并刷新页面重试';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    };
    
    document.head.appendChild(script);
    
    return () => {
      // 不移除脚本，因为其他组件可能也在使用
    };
  }, [onError]);
  
  // 创建图表
  useEffect(() => {
    if (!scriptLoaded || isLoading || klineData.length === 0 || !containerRef.current) {
      console.log(`图表创建条件未满足: scriptLoaded=${scriptLoaded}, isLoading=${isLoading}, klineData.length=${klineData.length}, containerRef.current=${!!containerRef.current}`);
      return;
    }
    
    try {
      console.log('开始创建图表...');
      
      // 确保容器有足够的尺寸
      const containerWidth = containerRef.current.clientWidth || 800;
      const containerHeight = containerRef.current.clientHeight || 400;
      
      console.log('容器尺寸:', containerWidth, 'x', containerHeight);
      
      // 如果容器尺寸太小，设置一个最小值
      if (containerWidth < 100 || containerHeight < 100) {
        console.warn('容器尺寸太小，可能导致图表渲染问题');
      }
      
      // 清除之前的图表
      if (chartInstance.current) {
        console.log('清除旧图表实例');
        chartInstance.current.remove();
        chartInstance.current = null;
        candlestickSeriesRef.current = null;
        volumeSeriesRef.current = null;
      }
      
      if (!window.LightweightCharts) {
        console.error('LightweightCharts库未正确加载');
        const errorMsg = '图表库未正确加载，请刷新页面重试';
        setError(errorMsg);
        if (onError) onError(errorMsg);
        setIsLoading(false);
        if (onLoadingChange) onLoadingChange(false);
        return;
      }
      
      // 创建新图表
      const { createChart } = window.LightweightCharts;
      
      if (typeof createChart !== 'function') {
        console.error('createChart不是一个函数:', typeof createChart);
        console.error('LightweightCharts对象内容:', JSON.stringify(Object.keys(window.LightweightCharts)));
        const errorMsg = '图表库API不可用，请刷新页面重试';
        setError(errorMsg);
        if (onError) onError(errorMsg);
        setIsLoading(false);
        if (onLoadingChange) onLoadingChange(false);
        return;
      }
      
      console.log('调用createChart创建图表...');
      const chart = createChart(containerRef.current, {
        width: containerWidth,
        height: containerHeight,
        layout: {
          background: { type: 'solid', color: '#1A2138' }, // 固定使用深色背景
          textColor: '#d9d9d9',
          fontFamily: 'Roboto, Arial, sans-serif',
        },
        grid: {
          vertLines: { color: 'rgba(42, 58, 92, 0.6)' }, // 更明显的网格线
          horzLines: { color: 'rgba(42, 58, 92, 0.6)' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: '#2A3A5C',
          barSpacing: 12, // 设置蜡烛图之间的固定间距
          minBarSpacing: 8, // 最小间距
          rightOffset: 5, // 右侧留白，为最新K线留出空间
          fixLeftEdge: true, // 固定左侧边缘，防止滑动超出数据范围
        },
        crosshair: {
          mode: 1, // CrosshairMode.Normal
          style: 1, // 实线
          vertLine: {
            color: 'rgba(255, 255, 255, 0.5)',
            width: 1,
            style: 1, // 实线
            labelVisible: true,
            labelBackgroundColor: '#4c5885',
          },
          horzLine: {
            color: 'rgba(255, 255, 255, 0.5)',
            width: 1,
            style: 1, // 实线
            labelVisible: true,
            labelBackgroundColor: '#4c5885',
          },
        },
        rightPriceScale: {
          borderColor: '#2A3A5C',
          scaleMargins: {
            top: 0.1, // 图表顶部留白比例
            bottom: 0.1, // 底部留白比例，不再为成交量留出空间，因为成交量将在单独的面板中显示
          },
          autoScale: true, // 自动缩放
          mode: 1, // 正常缩放模式
          ticksVisible: true, // 显示刻度
        },
        watermark: {
          visible: false, // 移除水印
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          mouseWheel: true,
          pinch: true,
          axisPressedMouseMove: {
            time: true,
            price: true,
          },
        },
      });
      
      console.log('图表创建成功');
      
      // 检查chart对象是否有效
      if (!chart || typeof chart.addCandlestickSeries !== 'function') {
        console.error('创建的chart对象无效', chart);
        console.error('chart方法:', Object.keys(chart).join(', '));
        const errorMsg = '图表创建失败: 内部API错误';
        setError(errorMsg);
        if (onError) onError(errorMsg);
        setIsLoading(false);
        if (onLoadingChange) onLoadingChange(false);
        return;
      }
      
      try {
        // 创建单独的成交量面板（使用同步时间轴）
        // 使成交量面板占据总高度的20%
        const mainPanelHeight = Math.floor(containerHeight * 0.80);
        const volumePanelHeight = containerHeight - mainPanelHeight;
        
        // 更新主面板高度
        chart.applyOptions({
          height: mainPanelHeight,
        });
        
        // 添加成交量面板
        const volumePanel = chart.addHistogramSeries({
          priceScaleId: 'volume', // 单独的价格轴ID
          priceFormat: {
            type: 'volume',
            precision: 0,
            minMove: 1,
          },
          color: 'rgba(76, 175, 80, 0.5)', // 默认颜色
          priceLineVisible: false,
          lastValueVisible: false,
          // 独立的价格标尺配置
          scaleMargins: {
            top: 0.1, // 上方留白
            bottom: 0.2, // 下方留白
          },
        });
        
        // 单独配置成交量价格轴
        chart.priceScale('volume').applyOptions({
          scaleMargins: {
            top: 0.8, // 成交量面板的位置，放在主图下方
            bottom: 0, // 底部没有空间
          },
          borderVisible: true,
          borderColor: '#2A3A5C',
          entireTextOnly: false,
          visible: true,
          autoScale: true,
        });
        
        // 添加K线图
        console.log('添加K线图系列...');
        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
          priceFormat: {
            type: 'price',
            precision: 5, // 价格精度，可以根据代币价格范围调整
            minMove: 0.00001, // 最小变动单位
          },
        });
        
        // 保存系列引用
        candlestickSeriesRef.current = candlestickSeries;
        volumeSeriesRef.current = volumePanel;
        
        // 准备数据
        const candleData = klineData.map(item => {
          // 转换时间格式为库需要的格式
          return {
            time: item.time,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
          };
        });
        
        console.log('设置K线数据...');
        if (candleData.length > 0) {
          console.log('数据示例:', JSON.stringify(candleData[0]));
        }
        
        // 设置K线数据
        candlestickSeries.setData(candleData);
        
        // 计算平均成交量和其他统计指标，用于后续归一化处理
        const volumes = klineData.map(item => item.volume);
        const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
        const maxVolume = Math.max(...volumes);
        const medianVolume = [...volumes].sort((a, b) => a - b)[Math.floor(volumes.length / 2)];
        
        // 设置绝对最大值 - 无论如何不会超过中位数的X倍
        const ABSOLUTE_MAX_VOLUME_MULTIPLIER = 3.0; // 成交量高度绝对不超过中位数的3倍
        const absoluteMaxVolume = medianVolume * ABSOLUTE_MAX_VOLUME_MULTIPLIER;
        
        console.log('成交量统计: 平均=', avgVolume, '最大=', maxVolume, '中位数=', medianVolume, 
                    '绝对最大高度=', absoluteMaxVolume);
        
        // 处理成交量数据
        const volumeData = klineData.map(item => {
          // 使用中位数作为基准
          const baseVolume = medianVolume > 0 ? medianVolume : avgVolume;
          
          // 计算归一化的成交量
          let normalizedVolume;
          
          if (item.volume <= baseVolume * 2) {
            // 正常范围内的成交量保持不变
            normalizedVolume = item.volume;
          } else if (item.volume <= baseVolume * 5) {
            // 中等异常值使用平方根缩放
            const excess = item.volume - baseVolume * 2;
            normalizedVolume = baseVolume * 2 + Math.sqrt(excess * baseVolume);
          } else {
            // 极端异常值使用对数缩放
            const mediumExcess = baseVolume * 3; // 中等异常范围大小
            const extremeExcess = item.volume - baseVolume * 5;
            normalizedVolume = baseVolume * 2 + Math.sqrt(mediumExcess * baseVolume) + 
                              Math.log10(1 + extremeExcess / baseVolume) * baseVolume;
          }
          
          // 应用绝对最大高度限制
          normalizedVolume = Math.min(normalizedVolume, absoluteMaxVolume);
          
          // 确保即使是最小的成交量也能看到
          normalizedVolume = Math.max(normalizedVolume, baseVolume * 0.1);
          
          // 设置颜色，上涨为绿色，下跌为红色，颜色更鲜明
          const color = item.close >= item.open 
            ? 'rgba(38, 166, 154, 0.9)' // 绿色
            : 'rgba(239, 83, 80, 0.9)'; // 红色
          
          return {
            time: item.time,
            value: normalizedVolume,
            color: color,
          };
        });
        
        // 设置成交量数据
        volumePanel.setData(volumeData);
        
        // 设置可见范围
        const visibleRange = Math.min(50, candleData.length); // 默认显示最近50根K线或全部
        
        // 适配内容并设置可见范围
        chart.timeScale().fitContent();
        chart.timeScale().setVisibleRange({
          from: candleData[Math.max(0, candleData.length - visibleRange)].time,
          to: candleData[candleData.length - 1].time,
        });
        
        // 添加时间轴的加载更多逻辑
        chart.timeScale().subscribeVisibleTimeRangeChange(() => {
          const visibleRange = chart.timeScale().getVisibleRange();
          if (visibleRange) {
            const earliestVisibleTime = visibleRange.from;
            // 如果滚动到接近最早的数据，自动加载更多
            if (candleData.length > 0 && earliestVisibleTime <= candleData[0].time + 5) { // 5是缓冲区
              loadMoreHistory();
            }
          }
        });
        
        console.log('图表数据设置完成');
        
        // 保存图表实例
        chartInstance.current = chart;
        
        // 成功创建图表后，设置加载状态为false
        setIsLoading(false);
        if (onLoadingChange) onLoadingChange(false);
        console.log('图表加载完成，隐藏加载指示器');
      } catch (seriesError) {
        console.error('添加数据系列时出错:', seriesError);
        const errorMsg = '创建图表系列失败: ' + (seriesError instanceof Error ? seriesError.message : String(seriesError));
        setError(errorMsg);
        if (onError) onError(errorMsg);
        setIsLoading(false);
        if (onLoadingChange) onLoadingChange(false);
        return;
      }
      
      // 添加窗口大小变化监听
      const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || !entries[0].contentRect) return;
        
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0 && chartInstance.current) {
          chartInstance.current.resize(width, height);
        }
      });
      
      resizeObserver.observe(containerRef.current);
      
      // 返回清理函数
      return () => {
        resizeObserver.disconnect();
        if (chartInstance.current) {
          try {
            chartInstance.current.remove();
            chartInstance.current = null;
            candlestickSeriesRef.current = null;
            volumeSeriesRef.current = null;
          } catch (cleanupError) {
            console.error('清理图表时出错:', cleanupError);
          }
        }
      };
    } catch (err) {
      console.error('创建图表时出错:', err);
      const errorMsg = '创建图表失败: ' + (err instanceof Error ? err.message : String(err));
      setError(errorMsg);
      if (onError) onError(errorMsg);
      setIsLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  }, [klineData, isLoading, theme, scriptLoaded, onLoadingChange, onError, loadMoreHistory, tokenChain, tokenAddress, currentInterval]);
  
  // 响应窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current && containerRef.current) {
        chartInstance.current.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight
        );
        chartInstance.current.timeScale().fitContent();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 添加一个额外的检查，确保在图表绘制后一定会取消加载状态
  useEffect(() => {
    // 如果图表实例存在但加载状态仍为true，则强制更新加载状态
    if (chartInstance.current && isLoading) {
      console.log('检测到图表已创建但加载状态未更新，强制更新状态');
      setIsLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  }, [isLoading, onLoadingChange]); // chartInstance.current作为引用会自动被跟踪
  
  // 同时添加一个超时保护，防止加载状态永远不会关闭
  useEffect(() => {
    if (!isLoading) return;
    
    // 如果加载超过15秒，强制关闭加载状态
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('图表加载超时，强制关闭加载状态');
        setIsLoading(false);
        if (onLoadingChange) onLoadingChange(false);
      }
    }, 15000);
    
    return () => clearTimeout(timeout);
  }, [isLoading, onLoadingChange]);
  
  // 手动向前/后移动图表
  const moveChart = useCallback((direction: 'left' | 'right') => {
    if (!chartInstance.current) return;
    
    const timeScale = chartInstance.current.timeScale();
    const visibleRange = timeScale.getVisibleRange();
    if (!visibleRange) return;
    
    const visibleBars = timeScale.getVisibleLogicalRange();
    if (!visibleBars) return;
    
    const barCount = Math.ceil(visibleBars.to - visibleBars.from);
    const moveAmount = Math.max(5, Math.floor(barCount * 0.3)); // 移动30%的可视K线数量，最少5根
    
    if (direction === 'left') {
      // 向左移动(向过去)
      timeScale.scrollToPosition(timeScale.scrollPosition() - moveAmount, false);
      
      // 如果滚动到数据起始点附近，尝试加载更多历史数据
      if (timeScale.scrollPosition() < 20) {
        loadMoreHistory();
      }
    } else {
      // 向右移动(向现在)
      timeScale.scrollToPosition(timeScale.scrollPosition() + moveAmount, false);
    }
  }, [loadMoreHistory]);
  
  // 缩放图表
  const zoomChart = useCallback((direction: 'in' | 'out') => {
    if (!chartInstance.current) return;
    
    const timeScale = chartInstance.current.timeScale();
    const factor = direction === 'in' ? 0.8 : 1.25; // 放大时缩小间距，缩小时增加间距
    
    // 获取当前间距
    const currentSpacing = timeScale.barSpacing();
    // 应用新间距
    timeScale.setBarSpacing(currentSpacing * factor);
  }, []);
  
  // 更新现有数据
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current || klineData.length === 0) return;
    
    // 仅在页面加载更多数据时(page > 0)更新系列
    if (page > 0) {
      const candleData = klineData.map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));
      
      // 计算统计数据
      const volumes = klineData.map(item => item.volume);
      const avgVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
      const maxVolume = Math.max(...volumes);
      const medianVolume = [...volumes].sort((a, b) => a - b)[Math.floor(volumes.length / 2)];
      
      // 设置绝对最大值 - 无论如何不会超过中位数的X倍
      const ABSOLUTE_MAX_VOLUME_MULTIPLIER = 3.0; // 成交量高度绝对不超过中位数的3倍
      const absoluteMaxVolume = medianVolume * ABSOLUTE_MAX_VOLUME_MULTIPLIER;
      
      // 处理成交量数据
      const volumeData = klineData.map(item => {
        // 使用中位数作为基准
        const baseVolume = medianVolume > 0 ? medianVolume : avgVolume;
        
        // 计算归一化的成交量
        let normalizedVolume;
        
        if (item.volume <= baseVolume * 2) {
          // 正常范围内的成交量保持不变
          normalizedVolume = item.volume;
        } else if (item.volume <= baseVolume * 5) {
          // 中等异常值使用平方根缩放
          const excess = item.volume - baseVolume * 2;
          normalizedVolume = baseVolume * 2 + Math.sqrt(excess * baseVolume);
        } else {
          // 极端异常值使用对数缩放
          const mediumExcess = baseVolume * 3; // 中等异常范围大小
          const extremeExcess = item.volume - baseVolume * 5;
          normalizedVolume = baseVolume * 2 + Math.sqrt(mediumExcess * baseVolume) + 
                          Math.log10(1 + extremeExcess / baseVolume) * baseVolume;
        }
        
        // 应用绝对最大高度限制
        normalizedVolume = Math.min(normalizedVolume, absoluteMaxVolume);
        
        // 确保即使是最小的成交量也能看到
        normalizedVolume = Math.max(normalizedVolume, baseVolume * 0.1);
        
        // 设置颜色，上涨为绿色，下跌为红色，颜色更鲜明
        const color = item.close >= item.open 
          ? 'rgba(38, 166, 154, 0.9)' // 绿色
          : 'rgba(239, 83, 80, 0.9)'; // 红色
        
        return {
          time: item.time,
          value: normalizedVolume,
          color: color,
        };
      });
      
      // 更新系列数据
      candlestickSeriesRef.current.setData(candleData);
      volumeSeriesRef.current.setData(volumeData);
      
      // 调整可见范围保持在用户当前查看的位置
      if (chartInstance.current) {
        const visibleRange = chartInstance.current.timeScale().getVisibleRange();
        if (visibleRange) {
          chartInstance.current.timeScale().setVisibleRange({
            from: visibleRange.from,
            to: visibleRange.to,
          });
        }
      }
    }
  }, [klineData, page]);
  
  // 添加自动刷新功能
  useEffect(() => {
    if (!autoRefresh) return;
    
    console.log(`设置自动刷新，间隔: ${refreshInterval}ms`);
    
    const refreshTimer = window.setInterval(() => {
      console.log('执行自动刷新...');
      fetchKlineData(0, false);
    }, refreshInterval);
    
    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [autoRefresh, refreshInterval, fetchKlineData]);
  
  return (
    <div className="w-full h-full bg-[#1A2138] dark:bg-[#1A2138] light:bg-white relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-opacity-70 bg-[#1A2138]">
          <div className="flex items-center">
            <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-gray-400">加载K线数据...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-opacity-90 bg-[#1A2138]">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            className="px-4 py-2 flex items-center bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => fetchKlineData(0, false)}
          >
            <RefreshCw className="w-4 h-4 mr-1" /> 重试
          </button>
        </div>
      )}
      
      <div 
        id={chartId.current}
        ref={containerRef} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      ></div>
    </div>
  );
} 