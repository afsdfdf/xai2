/**
 * 简单的API测试文件
 * 用于验证API响应格式
 */

import { ApiResponse, TokensResponse } from "./types/token";

// 测试获取热门代币
async function testHotTokens() {
  try {
    console.log("测试获取热门代币...");
    const response = await fetch("/api/tokens?topic=hot");
    
    if (!response.ok) {
      throw new Error(`API请求失败，状态码：${response.status}`);
    }
    
    const data = await response.json() as ApiResponse<TokensResponse>;
    console.log("API响应结构：", {
      success: data.success,
      hasData: !!data.data,
      hasTokens: data.data && Array.isArray(data.data.tokens),
      tokenCount: data.data?.tokens?.length || 0,
      timestamp: data.timestamp
    });
    
    return data;
  } catch (error) {
    console.error("测试失败：", error);
    return null;
  }
}

// 测试获取主题列表
async function testTopics() {
  try {
    console.log("测试获取主题列表...");
    const response = await fetch("/api/tokens?topic=topics");
    
    if (!response.ok) {
      throw new Error(`API请求失败，状态码：${response.status}`);
    }
    
    const data = await response.json();
    console.log("原始API响应：", data);
    
    return data;
  } catch (error) {
    console.error("测试失败：", error);
    return null;
  }
}

export { testHotTokens, testTopics }; 