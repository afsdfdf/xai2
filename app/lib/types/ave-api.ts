/**
 * AVE.ai API 类型定义
 * 参考文档: https://docs.ave.ai/reference/api-reference/v2
 */

// 通用API响应结构
export interface AveApiResponse<T> {
  status: number;
  msg: string;
  data_type: number;
  data: T;
}

// 错误响应结构
export interface AveErrorResponse {
  code: number;
  msg: string;
  data: Record<string, any>;
}

// 代币基本信息
export interface TokenInfo {
  token: string;
  chain: string;
  symbol: string;
  name: string;
  decimal: number | string;
  total: string;
  lock_amount: string;
  burn_amount: string;
  other_amount: string;
  fdv: string;
  market_cap: string;
  launch_price: number;
  launch_at: number;
  current_price_eth: number;
  current_price_usd: number;
  price_change_1d: number;
  price_change_24h: number;
  tx_volume_u_24h: string | number;
  tx_count_24h: number;
  holders: number;
  logo_url: string;
  risk_level: number;
  risk_score: number;
  buy_tax?: string | number;
  sell_tax?: string | number;
  locked_percent?: string;
  is_mintable?: string | number;
  created_at?: number;
  appendix?: string;
  [key: string]: any;
}

// 搜索代币请求参数
export interface SearchTokensParams {
  keyword: string;
  chain?: string;
}

// 获取代币价格请求体
export interface TokenPriceRequestBody {
  token_ids: string[];
  tvl_min?: number;
  tx_24h_volume_min?: number;
}

// K线数据点
export interface KLinePoint {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

// K线数据请求参数
export interface KLineParams {
  pair_id?: string;
  token_id?: string;
  interval?: number;
  size?: number;
  from?: number;
  to?: number;
  offset?: number;
}

// 代币排名请求参数
export interface TokenRankParams {
  topic: string;
  chain?: string;
  limit?: number;
}

// 代币详细信息请求参数
export interface TokenDetailsParams {
  token_id: string;
}

// 代币持有者请求参数
export interface TokenHoldersParams {
  token_id: string;
  offset?: number;
  limit?: number;
}

// 代币交易请求参数
export interface TokenTransactionsParams {
  pair_id: string;
  offset?: number;
  limit?: number;
}

// 链信息请求参数
export interface ChainInfoParams {
  chain?: string;
}

// 代币风险分析请求参数
export interface TokenRiskParams {
  token_id: string;
}

// 代币持有者信息
export interface TokenHolder {
  address: string;
  percent: string;
  quantity: string;
  mark?: string;
  analysis_show_warning?: string;
  analysis_show_creator?: string;
  is_contract?: number;
  is_lp?: number;
  lock?: any[];
}

// 代币风险分析响应
export interface TokenRiskAnalysis {
  token: string;
  chain: string;
  token_name: string;
  token_symbol: string;
  decimal: string;
  total: string;
  holders: number;
  is_honeypot: number;
  risk_score: number;
  is_open_source: string;
  is_proxy: string;
  has_mint_method: number;
  has_black_method: number;
  has_white_method: number;
  hidden_owner: string;
  can_take_back_ownership: string;
  external_call: string;
  selfdestruct: string;
  creator_address: string;
  creator_balance: string;
  creator_percent: string;
  token_holders_rank: TokenHolder[];
  // 其他风险分析字段
  [key: string]: any;
}

// DEX信息
export interface DexInfo {
  amm: string;
  liquidity: string;
  name: string;
  pair: string;
} 