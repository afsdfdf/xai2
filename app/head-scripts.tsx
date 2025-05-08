"use client"

import Script from "next/script"
import React from "react"

export const EthereumProtectionScript: React.FC = () => {
  return (
    <>
      <Script
        id="ethereum-protection-script"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            /* 保护用户不被钓鱼攻击 */
            window.addEventListener('DOMContentLoaded', () => {
              function protectAddress() {
                /* 保护用户地址不被复制或选择 */
                const elements = document.querySelectorAll('.eth-address');
                elements.forEach(el => {
                  el.setAttribute('unselectable', 'on');
                  el.setAttribute('style', 'user-select: none;');
                });
              }
              
              setInterval(protectAddress, 1000);
            });
          `,
        }}
      />
    </>
  )
}

export const LightweightChartsPreloader: React.FC = () => {
  return (
    <>
      <Script
        id="lightweight-charts-preloader"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            /* 预加载Lightweight Charts库 */
            (function() {
              try {
                console.log('预加载Lightweight Charts库...');
                
                // 检查是否已加载
                if (window.LightweightCharts) {
                  console.log('Lightweight Charts库已加载');
                  return;
                }
                
                // 创建script标签
                var script = document.createElement('script');
                script.id = 'lightweight-charts-script';
                script.src = 'https://unpkg.com/lightweight-charts@4.0.1/dist/lightweight-charts.standalone.production.js';
                script.crossOrigin = 'anonymous';
                script.async = false; // 同步加载以确保顺序
                
                // 添加到文档
                document.head.appendChild(script);
                
                console.log('Lightweight Charts预加载脚本已添加');
                
                // 设置超时检查
                setTimeout(function() {
                  if (!window.LightweightCharts) {
                    console.warn('警告: Lightweight Charts库加载可能失败');
                  } else {
                    console.log('确认: Lightweight Charts库加载成功');
                  }
                }, 5000);
              } catch (e) {
                console.error('预加载Lightweight Charts库出错:', e);
              }
            })();
          `,
        }}
      />
    </>
  )
} 