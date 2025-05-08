"use client"

import { useEffect } from "react"
import { safeLogError, installGlobalErrorHandlers } from "../lib/logging-helper"

/**
 * 增强版以太坊保护组件
 * 
 * 解决"Cannot redefine property: ethereum"错误，防止与钱包扩展的冲突
 * 使用更强大的保护机制，保存原始ethereum对象并阻止后续修改
 */
export default function EthereumProtection() {
  useEffect(() => {
    // 立即执行的保护函数
    const applyProtection = () => {
      try {
        // 检查window对象是否存在（服务器端渲染时不存在）
        if (typeof window === 'undefined') return;

        // 创建一个隔离的环境来保存原始ethereum对象
        const originalEthereumDescriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
        
        // 如果ethereum已经被设置为不可配置，不再尝试改变它
        if (originalEthereumDescriptor && originalEthereumDescriptor.configurable === false) {
          // 只安装错误处理器，不修改ethereum
          const removeErrorHandlers = installGlobalErrorHandlers();
          return removeErrorHandlers;
        }
        
        let originalEthereum = (window as any).ethereum;

        // 如果ethereum对象尚未存在，创建一个存根对象以便后续扩展可以使用
        if (!originalEthereum) {
          originalEthereum = {
            isPhantom: false,
            isCoinbaseWallet: false,
            isMetaMask: false,
            _isStub: true,
            request: async () => { throw new Error('Ethereum provider not initialized'); }
          };
        }

        // 完全冻结原始对象，防止修改
        try {
          Object.freeze(originalEthereum);
        } catch (e) {
          // 忽略冻结失败
        }

        // 仅在属性可配置或不存在时尝试定义
        if (!originalEthereumDescriptor || originalEthereumDescriptor.configurable !== false) {
          try {
            Object.defineProperty(window, 'ethereum', {
              configurable: false,  // 防止被重新定义
              enumerable: true,     // 保持可枚举性
              get: function() {
                return originalEthereum;
              },
              set: function() {
                // 静默忽略任何设置尝试
                return originalEthereum;
              }
            });
          } catch (e) {
            // 如果无法重定义属性（可能已经被定义为不可配置），则忽略错误
            // 使用更安全的方式记录错误，避免循环引用
            if (process.env.NODE_ENV !== 'production') {
              // 直接使用原始console.error，避免使用safeLogError造成循环引用
              try {
                const errorMsg = e instanceof Error ? e.message : 'Unknown error';
                console.warn(`[EthereumProtection] 定义属性失败: ${errorMsg}`);
              } catch (_) {
                // 完全忽略任何错误
              }
            }
          }
        }

        // 安装全局错误处理器
        const removeErrorHandlers = installGlobalErrorHandlers();

        // 返回清理函数
        return () => {
          removeErrorHandlers();
        };
      } catch (error) {
        // 确保即使保护机制失败，也不会阻止应用程序运行
        // 使用更安全的方式记录错误，避免循环引用
        if (process.env.NODE_ENV !== 'production') {
          try {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.warn(`[EthereumProtection] 初始化失败: ${errorMsg}`);
          } catch (_) {
            // 完全忽略任何错误
          }
        }
        return () => {};  // 返回空清理函数
      }
    };

    // 应用保护并保存清理函数
    const cleanup = applyProtection();
    return cleanup;
  }, []);
  
  return null; // 这个组件不渲染任何内容
} 