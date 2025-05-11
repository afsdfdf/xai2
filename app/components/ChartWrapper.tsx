"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react"
import { getTokenKlineData } from "@/app/lib/ave-api-service"

interface ChartWrapperProps {
  darkMode: boolean
  tokenAddress?: string
  tokenChain?: string
  interval?: string
}

interface KLineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 币安风格的颜色常量
const BINANCE_COLORS = {
  background: '#0e1217',
  grid: '#222830',
  upColor: '#0ecb81',       // 上涨颜色 - 绿色
  downColor: '#f6465d',     // 下跌颜色 - 红色
  textColor: '#b7bdc6',     // 文本颜色
  ma5Color: '#ffd301',      // MA5线颜色 - 黄色
  ma10Color: '#3C90EB',     // MA10线颜色 - 蓝色
  volumeUp: 'rgba(14, 203, 129, 0.3)',
  volumeDown: 'rgba(246, 70, 93, 0.3)',
  tooltip: '#1e222d'
};

export default function ChartWrapper({ 
  darkMode, 
  tokenAddress = "0xtoken", 
  tokenChain = "eth",
  interval = "1h"
}: ChartWrapperProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [klineData, setKlineData] = useState<KLineData[]>([])
  const [displayData, setDisplayData] = useState<KLineData[]>([]) // 实际显示的数据
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredCandle, setHoveredCandle] = useState<KLineData | null>(null)
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null)
  
  // 控制图表的缩放与平移
  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    count: 30,  // 默认显示30个蜡烛图
  })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{x: number, rangeStart: number} | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1) // 缩放级别
  
  // 固定蜡烛宽度配置
  const CANDLE_WIDTH = 8;  // 固定蜡烛宽度 (px)
  const CANDLE_GAP = 2;    // 蜡烛间距 (px)

  // 获取K线数据
  const fetchKlineData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // 获取数据点数量，为每个时间区间设置合适的数据点
      const pointsMap: Record<string, number> = {
        '1m': 240,   // 获取更多数据点以便缩放
        '5m': 240,
        '15m': 192,
        '1h': 168,
        '4h': 168,
        '1d': 120,
        '1w': 104
      };
      
      const points = pointsMap[interval] || 120;
      
      const data = await getTokenKlineData(tokenAddress, tokenChain, interval, points)
      if (data && data.length > 0) {
        setKlineData(data)
        
        // 默认显示最新的30个蜡烛图
        const initialVisibleCount = Math.min(30, data.length);
        setVisibleRange({
          start: Math.max(0, data.length - initialVisibleCount),
          count: initialVisibleCount
        });
        
        setDisplayData(data.slice(Math.max(0, data.length - initialVisibleCount)));
      } else {
        throw new Error("未获得K线数据")
      }
    } catch (err) {
      console.error("获取K线数据失败:", err)
      setError(err instanceof Error ? err.message : "未获得K线数据")
      // 使用模拟数据
      const mockData = generateMockKlineData();
      setKlineData(mockData);
      
      // 默认显示最新的30个蜡烛图
      const initialVisibleCount = Math.min(30, mockData.length);
      setVisibleRange({
        start: Math.max(0, mockData.length - initialVisibleCount),
        count: initialVisibleCount
      });
      
      setDisplayData(mockData.slice(Math.max(0, mockData.length - initialVisibleCount)));
    } finally {
      setIsLoading(false)
    }
  }

  // 生成模拟K线数据
  const generateMockKlineData = (): KLineData[] => {
    const now = Math.floor(Date.now() / 1000)
    const basePrice = 0.007354
    const volatility = 0.005
    
    // 根据不同时间间隔设置不同的时间增量
    let timeIncrement: number;
    switch(interval) {
      case '1m': timeIncrement = 60; break;
      case '5m': timeIncrement = 300; break;
      case '15m': timeIncrement = 900; break;
      case '1h': timeIncrement = 3600; break;
      case '4h': timeIncrement = 14400; break;
      case '1d': timeIncrement = 86400; break;
      case '1w': timeIncrement = 604800; break;
      default: timeIncrement = 3600;
    }
    
    // 生成更多数据点以支持缩放
    return Array(120).fill(0).map((_, index) => {
      const timeOffset = (120 - index) * timeIncrement
      const time = now - timeOffset
      
      const randomFactor = 0.5 - Math.random()
      const priceChange = basePrice * volatility * randomFactor
      
      const open = basePrice + priceChange * (index - 1) / 120
      const close = basePrice + priceChange * index / 120
      const high = Math.max(open, close) * (1 + Math.random() * 0.02)
      const low = Math.min(open, close) * (1 - Math.random() * 0.02)
      const volume = 100 + Math.random() * 2000
      
      return { time, open, high, low, close, volume }
    })
  }

  // 当区间改变时，更新显示的数据
  useEffect(() => {
    if (klineData.length === 0) return;
    
    // 确保范围有效
    const safeStart = Math.max(0, Math.min(visibleRange.start, klineData.length - 1));
    const safeCount = Math.min(visibleRange.count, klineData.length - safeStart);
    
    // 更新显示的数据
    setDisplayData(klineData.slice(safeStart, safeStart + safeCount));
  }, [visibleRange, klineData]);

  useEffect(() => {
    fetchKlineData()
  }, [tokenAddress, tokenChain, interval])

  // 缩放功能
  const handleZoomIn = () => {
    if (visibleRange.count <= 10) return; // 防止过度缩放
    
    const newCount = Math.max(10, Math.floor(visibleRange.count * 0.7));
    const centerIndex = visibleRange.start + visibleRange.count / 2;
    const newStart = Math.max(0, Math.floor(centerIndex - newCount / 2));
    
    setVisibleRange({
      start: newStart,
      count: newCount
    });
  };
  
  const handleZoomOut = () => {
    if (visibleRange.count >= klineData.length) return; // 已经显示全部数据
    
    const newCount = Math.min(klineData.length, Math.floor(visibleRange.count * 1.5));
    const centerIndex = visibleRange.start + visibleRange.count / 2;
    const newStart = Math.max(0, Math.floor(centerIndex - newCount / 2));
    
    setVisibleRange({
      start: newStart,
      count: newCount
    });
  };
  
  // 移动到更早的数据
  const handleMoveLeft = () => {
    if (visibleRange.start <= 0) return; // 已经是最早的数据
    
    const newStart = Math.max(0, visibleRange.start - Math.floor(visibleRange.count / 2));
    setVisibleRange({
      ...visibleRange,
      start: newStart
    });
  };
  
  // 移动到更新的数据
  const handleMoveRight = () => {
    const maxStart = klineData.length - visibleRange.count;
    if (visibleRange.start >= maxStart) return; // 已经是最新的数据
    
    const newStart = Math.min(maxStart, visibleRange.start + Math.floor(visibleRange.count / 2));
    setVisibleRange({
      ...visibleRange,
      start: newStart
    });
  };
  
  // 处理鼠标拖动事件
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!chartRef.current) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      rangeStart: visibleRange.start
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !chartRef.current) return;
    
    const rect = chartRef.current.getBoundingClientRect();
    const chartWidth = rect.width;
    
    // 计算拖动的距离（像素）
    const dragDistance = e.clientX - dragStart.x;
    
    // 将像素距离转换为蜡烛数量
    const candlesPerPixel = visibleRange.count / chartWidth;
    const candleDragAmount = Math.round(dragDistance * candlesPerPixel);
    
    // 更新可见范围
    const newStart = Math.max(0, Math.min(klineData.length - visibleRange.count, dragStart.rangeStart - candleDragAmount));
    
    setVisibleRange({
      ...visibleRange,
      start: newStart
    });
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };
  
  // 处理鼠标滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    if (e.deltaY < 0) {
      // 向上滚动 - 放大
      handleZoomIn();
    } else {
      // 向下滚动 - 缩小
      handleZoomOut();
    }
  };

  // 格式化时间戳为可读时间
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    
    switch(interval) {
      case '1m':
      case '5m':
      case '15m':
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      case '1h':
      case '4h':
        return `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:00`;
      case '1d':
        return `${date.getMonth()+1}/${date.getDate()}`;
      case '1w':
        return `${date.getMonth()+1}/${date.getDate()}周`;
      default:
        return `${date.getMonth()+1}/${date.getDate()}`;
    }
  };

  useEffect(() => {
    // 绘制K线图
    const drawKLineChart = () => {
      if (!chartRef.current || displayData.length === 0) return
      
      const ctx = document.createElement('canvas')
      ctx.width = chartRef.current.clientWidth
      ctx.height = chartRef.current.clientHeight
      chartRef.current.innerHTML = ''
      chartRef.current.appendChild(ctx)
      
      const context = ctx.getContext('2d')
      if (!context) return
      
      // 图表区域定义
      const chartWidth = ctx.width;
      const chartHeight = ctx.height;
      const margin = {
        top: 20,
        right: 60,
        bottom: 30,
        left: 10
      };
      const volumeHeight = chartHeight * 0.2; // 底部20%显示成交量
      const priceChartHeight = chartHeight - volumeHeight - margin.top - margin.bottom;
      
      // 绘制背景
      context.fillStyle = BINANCE_COLORS.background;
      context.fillRect(0, 0, chartWidth, chartHeight);
      
      // 找出最高和最低价格
      const highestPrice = Math.max(...displayData.map(k => k.high)) * 1.005; // 顶部留5%空间
      const lowestPrice = Math.min(...displayData.map(k => k.low)) * 0.995;   // 底部留5%空间
      const priceRange = highestPrice - lowestPrice;
      
      // 找出最大成交量
      const maxVolume = Math.max(...displayData.map(k => k.volume));
      
      // 计算单个蜡烛图的宽度和间距 - 固定大小
      const totalWidth = chartWidth - margin.left - margin.right;
      
      // 确保蜡烛图可以完全显示
      const availableSpace = totalWidth / displayData.length;
      const kLineWidth = Math.min(availableSpace * 0.8, CANDLE_WIDTH); // 最大宽度固定为设置值
      const gapWidth = Math.min(availableSpace * 0.2, CANDLE_GAP);     // 间隙
      
      // 计算总宽度是否超出可显示区域
      const totalCandleWidth = (kLineWidth + gapWidth) * displayData.length;
      const scaleX = totalCandleWidth > totalWidth ? totalWidth / totalCandleWidth : 1;
      
      // 绘制网格
      context.strokeStyle = BINANCE_COLORS.grid;
      context.lineWidth = 0.5;
      
      // 横向网格线 - 价格区域
      const priceGridCount = 5;
      for (let i = 0; i <= priceGridCount; i++) {
        const y = margin.top + (priceChartHeight / priceGridCount) * i;
        
        context.beginPath();
        context.moveTo(margin.left, y);
        context.lineTo(chartWidth - margin.right, y);
        context.stroke();
        
        // 添加价格标签
        const price = highestPrice - (i / priceGridCount) * priceRange;
        context.fillStyle = BINANCE_COLORS.textColor;
        context.font = '10px Arial';
        context.textAlign = 'right';
        context.fillText(price.toFixed(6), chartWidth - margin.right + 45, y + 4);
      }
      
      // 成交量区域网格
      const volumeTop = margin.top + priceChartHeight;
      context.beginPath();
      context.moveTo(margin.left, volumeTop);
      context.lineTo(chartWidth - margin.right, volumeTop);
      context.stroke();
      
      // 垂直网格线 - 根据K线位置绘制
      const showXLabels = interval !== '1m' && interval !== '5m'; // 较小时间间隔不显示所有标签
      const labelInterval = Math.max(1, Math.floor(displayData.length / 10)); // 自适应标签间隔
      
      for (let i = 0; i < displayData.length; i++) {
        if (i % labelInterval === 0 || i === displayData.length - 1) {
          const x = margin.left + i * (kLineWidth + gapWidth) * scaleX + kLineWidth / 2 * scaleX;
          
          // 垂直网格线
          context.beginPath();
          context.moveTo(x, margin.top);
          context.lineTo(x, chartHeight - margin.bottom);
          context.stroke();
          
          // 时间标签
          if (showXLabels && (i % (labelInterval * 2) === 0 || i === displayData.length - 1)) {
            const timeStr = formatTime(displayData[i].time);
            context.fillStyle = BINANCE_COLORS.textColor;
            context.font = '10px Arial';
            context.textAlign = 'center';
            context.fillText(timeStr, x, chartHeight - margin.bottom + 20);
          }
        }
      }
      
      // 绘制K线
      for (let i = 0; i < displayData.length; i++) {
        const kLine = displayData[i];
        const x = margin.left + i * (kLineWidth + gapWidth) * scaleX + kLineWidth / 2 * scaleX;
        
        // 判断上涨还是下跌
        const isUp = kLine.close >= kLine.open;
        const fillColor = isUp ? BINANCE_COLORS.upColor : BINANCE_COLORS.downColor;
        
        // 计算K线位置
        const openY = margin.top + ((highestPrice - kLine.open) / priceRange) * priceChartHeight;
        const closeY = margin.top + ((highestPrice - kLine.close) / priceRange) * priceChartHeight;
        const highY = margin.top + ((highestPrice - kLine.high) / priceRange) * priceChartHeight;
        const lowY = margin.top + ((highestPrice - kLine.low) / priceRange) * priceChartHeight;
        
        // 绘制影线
        context.beginPath();
        context.strokeStyle = fillColor;
        context.moveTo(x, highY);
        context.lineTo(x, lowY);
        context.stroke();
        
        // 绘制K线实体
        context.fillStyle = fillColor;
        const candleHeight = Math.abs(closeY - openY);
        const yTop = isUp ? closeY : openY;
        
        // 确保K线至少有1px高度
        const rectHeight = Math.max(candleHeight, 1);
        
        if (kLineWidth * scaleX > 3) {
          // 当宽度足够时绘制实体
          context.fillRect(
            x - kLineWidth / 2 * scaleX,
            yTop,
            kLineWidth * scaleX,
            rectHeight
          );
        } else {
          // 当宽度太窄时绘制线
          context.beginPath();
          context.moveTo(x, openY);
          context.lineTo(x, closeY);
          context.stroke();
        }
        
        // 绘制成交量
        const volumeHeight = (kLine.volume / maxVolume) * (chartHeight - margin.top - margin.bottom - priceChartHeight);
        context.fillStyle = isUp ? BINANCE_COLORS.volumeUp : BINANCE_COLORS.volumeDown;
        context.fillRect(
          x - kLineWidth / 2 * scaleX,
          chartHeight - margin.bottom - volumeHeight,
          kLineWidth * scaleX,
          volumeHeight
        );
      }
      
      // 绘制MA5线
      if (displayData.length >= 5) {
        context.beginPath();
        context.strokeStyle = BINANCE_COLORS.ma5Color;
        context.lineWidth = 1.5;
        
        for (let i = 4; i < displayData.length; i++) {
          let sum = 0;
          for (let j = i - 4; j <= i; j++) {
            sum += displayData[j].close;
          }
          const ma5 = sum / 5;
          const ma5Y = margin.top + ((highestPrice - ma5) / priceRange) * priceChartHeight;
          const x = margin.left + i * (kLineWidth + gapWidth) * scaleX + kLineWidth / 2 * scaleX;
          
          if (i === 4) {
            context.moveTo(x, ma5Y);
          } else {
            context.lineTo(x, ma5Y);
          }
        }
        context.stroke();
      }
      
      // 绘制MA10线
      if (displayData.length >= 10) {
        context.beginPath();
        context.strokeStyle = BINANCE_COLORS.ma10Color;
        context.lineWidth = 1.5;
        
        for (let i = 9; i < displayData.length; i++) {
          let sum = 0;
          for (let j = i - 9; j <= i; j++) {
            sum += displayData[j].close;
          }
          const ma10 = sum / 10;
          const ma10Y = margin.top + ((highestPrice - ma10) / priceRange) * priceChartHeight;
          const x = margin.left + i * (kLineWidth + gapWidth) * scaleX + kLineWidth / 2 * scaleX;
          
          if (i === 9) {
            context.moveTo(x, ma10Y);
          } else {
            context.lineTo(x, ma10Y);
          }
        }
        context.stroke();
      }
      
      // 添加MA图例
      context.font = '10px Arial';
      context.textAlign = 'left';
      context.fillStyle = BINANCE_COLORS.ma5Color;
      context.fillText('MA5', margin.left + 10, margin.top + 15);
      context.fillStyle = BINANCE_COLORS.ma10Color;
      context.fillText('MA10', margin.left + 60, margin.top + 15);
      
      // 添加最新价格标签
      const lastPrice = displayData[displayData.length - 1].close;
      context.fillStyle = lastPrice > displayData[displayData.length - 2].close ? 
        BINANCE_COLORS.upColor : BINANCE_COLORS.downColor;
      context.font = 'bold 12px Arial';
      context.textAlign = 'right';
      context.fillText(`$${lastPrice.toFixed(6)}`, chartWidth - margin.right + 45, margin.top - 5);
      
      // 显示当前查看的范围信息
      const rangeInfo = `${visibleRange.start+1}-${visibleRange.start+visibleRange.count}/${klineData.length}`;
      context.fillStyle = BINANCE_COLORS.textColor;
      context.font = '10px Arial';
      context.textAlign = 'left';
      context.fillText(rangeInfo, margin.left, chartHeight - 5);
      
      // 如果是模拟数据，添加标记
      if (error) {
        context.fillStyle = 'rgba(255, 165, 0, 0.7)';
        context.fillRect(10, 10, 90, 20);
        context.fillStyle = '#000';
        context.fillText('模拟数据', 15, 25);
      }
      
      // 处理鼠标悬停
      const handleCanvasMouseMove = (e: MouseEvent) => {
        if (!chartRef.current || isDragging) return;
        
        const rect = chartRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 检查鼠标是否在图表区域内
        if (x < margin.left || x > chartWidth - margin.right || 
            y < margin.top || y > chartHeight - margin.bottom) {
          setHoveredCandle(null);
          return;
        }
        
        // 找到最接近的K线
        const kLineIndexApprox = Math.floor((x - margin.left) / ((kLineWidth + gapWidth) * scaleX));
        const kLineIndex = Math.max(0, Math.min(kLineIndexApprox, displayData.length - 1));
        
        if (kLineIndex >= 0 && kLineIndex < displayData.length) {
          setHoveredCandle(displayData[kLineIndex]);
          setMousePos({x, y});
          
          // 绘制垂直辅助线
          const canvasX = margin.left + kLineIndex * (kLineWidth + gapWidth) * scaleX + kLineWidth / 2 * scaleX;
          
          // 清除之前的辅助线
          drawKLineChart();
          
          // 绘制新辅助线
          context.strokeStyle = 'rgba(255,255,255,0.3)';
          context.lineWidth = 0.5;
          context.setLineDash([2, 2]);
          context.beginPath();
          context.moveTo(canvasX, margin.top);
          context.lineTo(canvasX, chartHeight - margin.bottom);
          context.stroke();
          context.setLineDash([]);
          
          // 绘制水平价格线
          const candle = displayData[kLineIndex];
          const priceY = margin.top + ((highestPrice - candle.close) / priceRange) * priceChartHeight;
          
          context.beginPath();
          context.moveTo(margin.left, priceY);
          context.lineTo(chartWidth - margin.right, priceY);
          context.stroke();
          
          // 绘制价格标签
          context.fillStyle = BINANCE_COLORS.tooltip;
          context.fillRect(chartWidth - margin.right, priceY - 10, 50, 20);
          context.fillStyle = candle.close > candle.open ? BINANCE_COLORS.upColor : BINANCE_COLORS.downColor;
          context.textAlign = 'center';
          context.fillText('$' + candle.close.toFixed(6), chartWidth - margin.right + 25, priceY + 4);
        }
      };
      
      // 处理鼠标离开
      const handleCanvasMouseLeave = () => {
        if (!isDragging) {
          setHoveredCandle(null);
          drawKLineChart();
        }
      };
      
      if (chartRef.current) {
        const canvasElement = chartRef.current.querySelector('canvas');
        if (canvasElement) {
          canvasElement.addEventListener('mousemove', handleCanvasMouseMove);
          canvasElement.addEventListener('mouseleave', handleCanvasMouseLeave);
        }
      }
      
      return () => {
        if (chartRef.current) {
          const canvasElement = chartRef.current.querySelector('canvas');
          if (canvasElement) {
            canvasElement.removeEventListener('mousemove', handleCanvasMouseMove);
            canvasElement.removeEventListener('mouseleave', handleCanvasMouseLeave);
          }
        }
      };
    };
    
    const cleanup = drawKLineChart();
    
    // 窗口大小变化时重新绘制
    const handleResize = () => {
      if (cleanup) cleanup();
      drawKLineChart();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (cleanup) cleanup();
      window.removeEventListener('resize', handleResize);
    };
  }, [displayData, error, darkMode, hoveredCandle, isDragging, klineData.length, visibleRange]);
  
  // 渲染tooltip
  const renderTooltip = () => {
    if (!hoveredCandle || !mousePos || isDragging) return null;
    
    const date = new Date(hoveredCandle.time * 1000);
    const dateStr = date.toLocaleDateString();
    const timeStr = date.toLocaleTimeString();
    const isUp = hoveredCandle.close >= hoveredCandle.open;
    const changePercent = ((hoveredCandle.close - hoveredCandle.open) / hoveredCandle.open * 100).toFixed(2);
    const changeDirection = isUp ? '+' : '';
    
    return (
      <div 
        className="absolute z-10 bg-[#1e222d] border border-gray-700 rounded p-2 text-xs shadow-lg"
        style={{
          left: mousePos.x + 15,
          top: mousePos.y - 80,
          maxWidth: '200px'
        }}
      >
        <div className="font-bold">{dateStr} {timeStr}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
          <div>开盘: <span className="font-mono">${hoveredCandle.open.toFixed(6)}</span></div>
          <div>收盘: <span className={`font-mono ${isUp ? 'text-green-500' : 'text-red-500'}`}>
            ${hoveredCandle.close.toFixed(6)}
          </span></div>
          <div>最高: <span className="font-mono">${hoveredCandle.high.toFixed(6)}</span></div>
          <div>最低: <span className="font-mono">${hoveredCandle.low.toFixed(6)}</span></div>
          <div>涨跌幅: <span className={`font-mono ${isUp ? 'text-green-500' : 'text-red-500'}`}>
            {changeDirection}{changePercent}%
          </span></div>
          <div>成交量: <span className="font-mono">{hoveredCandle.volume.toFixed(2)}</span></div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full h-full bg-[#0e1217] relative">
      {isLoading ? (
        <div className="flex justify-center items-center h-full text-gray-400">
          <div className="animate-spin mr-2 h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          正在加载K线数据...
        </div>
      ) : (
        <>
          {/* 图表区域 */}
          <div 
            ref={chartRef} 
            className="w-full h-full cursor-grab"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          />
          
          {/* 辅助提示 */}
          <div className="absolute bottom-3 right-3 text-gray-400 text-xs bg-[#16191e] rounded px-2 py-1">
            滚轮: 缩放 | 拖动: 平移
          </div>
          
          {/* 悬停提示 */}
          {hoveredCandle && !isDragging && renderTooltip()}
          
          {/* 指标和图表工具栏 */}
          <div className="absolute left-2 top-2 flex text-gray-400 text-xs space-x-2">
            <div className="text-yellow-400">MA5</div>
            <div className="text-blue-400">MA10</div>
          </div>
          
          {/* 缩放和导航控制按钮 */}
          <div className="absolute top-2 right-2 flex space-x-1">
            {error && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-xs p-1 h-7"
                onClick={fetchKlineData}
                title="重新加载数据"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
            )}
            
            <Button 
              className="bg-gray-800 hover:bg-gray-700 text-xs p-1 h-7"
              onClick={handleMoveLeft}
              title="查看更早数据"
              disabled={visibleRange.start <= 0}
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            
            <Button 
              className="bg-gray-800 hover:bg-gray-700 text-xs p-1 h-7"
              onClick={handleZoomIn}
              title="放大"
              disabled={visibleRange.count <= 10}
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
            
            <Button 
              className="bg-gray-800 hover:bg-gray-700 text-xs p-1 h-7"
              onClick={handleZoomOut}
              title="缩小"
              disabled={visibleRange.count >= klineData.length}
            >
              <ZoomOut className="w-3 h-3" />
            </Button>
            
            <Button 
              className="bg-gray-800 hover:bg-gray-700 text-xs p-1 h-7"
              onClick={handleMoveRight}
              title="查看更新数据"
              disabled={visibleRange.start + visibleRange.count >= klineData.length}
            >
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
} 