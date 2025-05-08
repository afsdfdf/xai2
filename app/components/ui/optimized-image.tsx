"use client"

import Image, { ImageProps } from "next/image"
import { useState, useEffect } from "react"

interface OptimizedImageProps extends Omit<ImageProps, 'onError'> {
  debug?: boolean
  useStaticFallback?: boolean
  fallbackSrc?: string
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  priority,
  className,
  style,
  sizes,
  quality,
  placeholder,
  debug = false,
  useStaticFallback = false,
  fallbackSrc = "/LOGO.JPG",
  ...rest
}: OptimizedImageProps) {
  const [error, setError] = useState(false)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  
  // 预检查图像URL是否为空或无效
  useEffect(() => {
    if (!src || typeof src !== 'string') {
      if (debug) console.log(`Invalid image source: ${src}`)
      setError(true)
      return
    }
    
    // 如果URL不是以http开头，可能是相对路径，直接设置
    if (!src.startsWith('http')) {
      setImgSrc(src)
      return
    }
    
    // 设置有效的URL
    setImgSrc(src)
  }, [src, debug])
  
  // 确定最终要显示的图像源
  const finalSrc = error && useStaticFallback ? fallbackSrc : imgSrc || fallbackSrc
  
  if (debug && error) {
    console.log(`Image failed to load: ${src}`)
  }

  // 如果没有有效的图像源，显示首字母或默认占位符
  if (!imgSrc && error) {
    return (
      <div className={`${className || ''} bg-gray-800 flex items-center justify-center text-white`} style={style}>
        {alt ? alt.charAt(0).toUpperCase() : '?'}
      </div>
    )
  }

  return (
    <Image
      src={finalSrc}
      alt={alt || ""}
      width={width}
      height={height}
      fill={fill}
      priority={priority}
      className={className}
      style={style}
      sizes={sizes}
      quality={quality || 75}
      placeholder={placeholder}
      onError={() => {
        if (debug) console.log(`Image load error for: ${imgSrc}`)
        setError(true)
      }}
      {...rest}
    />
  )
} 