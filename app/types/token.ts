/**
 * 代币排名主题
 */
export interface RankTopic {
  /** 主题ID */
  id: string;
  /** 英文名称 */
  name_en: string;
  /** 中文名称 */
  name_zh: string;
}

/**
 * 代币数据
 */
export interface TokenRanking {
  /** 代币合约地址 */
  token: string;
  /** 区块链网络 */
  chain: string;
  /** 代币符号 */
  symbol: string;
  /** 代币名称 */
  name: string;
  /** logo URL */
  logo_url: string;
  /** 当前美元价格 */
  current_price_usd: number;
  /** 24小时价格变化百分比 */
  price_change_24h: number;
  /** 24小时交易量（美元） */
  tx_volume_u_24h: number;
  /** 持有者数量 */
  holders: number;
  /** 市值 */
  market_cap?: string;
  /** 完全稀释估值 */
  fdv?: string;
  /** 风险评分 */
  risk_score?: string;
}

/**
 * API响应状态
 */
export interface ApiResponse<T> {
  /** 是否成功 */
  success: boolean;
  /** 数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 代币列表响应
 */
export interface TokensResponse {
  /** 代币列表 */
  tokens: TokenRanking[];
  /** 总数 */
  count: number;
  /** 主题ID */
  topic?: string;
}

/**
 * 主题列表响应
 */
export interface TopicsResponse {
  /** 主题列表 */
  topics: RankTopic[];
} 