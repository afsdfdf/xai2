from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import logging
import time
import json
import random
import os
import threading
import schedule

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 缓存文件路径
CACHE_DIR = "cache"
CACHE_FILES = {
    "token_boosts": os.path.join(CACHE_DIR, "token_boosts.json"),
    "home_data": os.path.join(CACHE_DIR, "home_data.json"),
    "ave_data": os.path.join(CACHE_DIR, "ave_data.json")
}

# 确保缓存目录存在
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

# 内存缓存
cache = {
    "token_boosts": {"data": None, "timestamp": 0},
    "home_data": {"data": None, "timestamp": 0},
    "ave_data": {"data": None, "timestamp": 0}
}

# 缓存过期时间（单位：秒）
CACHE_EXPIRY = {
    "token_boosts": 900,  # 15分钟
    "home_data": 1200,    # 20分钟
    "ave_data": 1800      # 30分钟
}

# 加载持久化缓存
def load_cache_from_disk():
    for cache_key, file_path in CACHE_FILES.items():
        try:
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    cached_data = json.load(f)
                    cache[cache_key] = cached_data
                    logger.info(f"Loaded {cache_key} cache from disk, timestamp: {cached_data['timestamp']}")
        except Exception as e:
            logger.error(f"Error loading {cache_key} cache from disk: {str(e)}")

# 保存缓存到磁盘
def save_cache_to_disk(cache_key):
    try:
        with open(CACHE_FILES[cache_key], 'w') as f:
            json.dump(cache[cache_key], f)
        logger.info(f"Saved {cache_key} cache to disk")
    except Exception as e:
        logger.error(f"Error saving {cache_key} cache to disk: {str(e)}")

# 检查缓存是否有效
def is_cache_valid(cache_key):
    return (cache[cache_key]["data"] is not None and 
            time.time() - cache[cache_key]["timestamp"] < CACHE_EXPIRY[cache_key])

# 后台更新缓存的函数
def background_update_caches():
    logger.info("Starting background cache update...")
    try:
        # 更新token_boosts缓存
        update_token_boosts_cache()
        
        # 更新home_data缓存
        update_home_data_cache()
        
        # 更新Ave API数据缓存
        update_ave_data_cache()
        
        logger.info("Background cache update completed successfully")
    except Exception as e:
        logger.error(f"Error in background cache update: {str(e)}")

# 更新token_boosts缓存
def update_token_boosts_cache():
    try:
        logger.info("Updating token_boosts cache in background")
        response = requests.get(
            "https://api.dexscreener.com/token-boosts/top/v1",
            headers={"Accept": "*/*"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            tokens = []
            
            if "data" in data:
                for token in data["data"]:
                    formatted_token = {
                        "name": token.get("name", "Unknown"),
                        "symbol": token.get("symbol", "Unknown"),
                        "address": token.get("address", ""),
                        "logo": token.get("logo"),
                        "price": token.get("price", {}).get("usd"),
                        "chain": token.get("chain", "ethereum")
                    }
                    tokens.append(formatted_token)
            
            # 更新缓存
            current_time = time.time()
            cache["token_boosts"]["data"] = {
                "tokens": tokens,
                "count": len(tokens),
                "success": True,
                "timestamp": current_time
            }
            cache["token_boosts"]["timestamp"] = current_time
            
            # 保存到磁盘
            save_cache_to_disk("token_boosts")
            logger.info(f"Token boosts cache updated with {len(tokens)} tokens")
            return True
        else:
            logger.warning(f"Failed to update token_boosts cache: HTTP {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"Error updating token_boosts cache: {str(e)}")
        return False

# 更新home_data缓存
def update_home_data_cache():
    try:
        logger.info("Updating home_data cache in background")
        
        # 获取token数据
        tokens = []
        if is_cache_valid("token_boosts") and cache["token_boosts"]["data"]:
            tokens = cache["token_boosts"]["data"]["tokens"]
        else:
            # 尝试更新token_boosts缓存
            if update_token_boosts_cache() and cache["token_boosts"]["data"]:
                tokens = cache["token_boosts"]["data"]["tokens"]
            else:
                # 使用fallback数据
                tokens = get_fallback_tokens()
        
        # 创建分段数据集
        trending_tokens = tokens[:10] if len(tokens) >= 10 else tokens
        
        # 按价格排序获取高价值代币
        popular_tokens = sorted(tokens, key=lambda x: x.get("price", 0) or 0, reverse=True)
        popular_tokens = popular_tokens[:15] if len(popular_tokens) >= 15 else popular_tokens
        
        # 使用最后的代币作为"新"代币
        new_tokens = tokens[-20:] if len(tokens) >= 20 else tokens
        
        # 创建响应对象
        current_time = time.time()
        result = {
            "tokens": tokens,
            "count": len(tokens),
            "trending": trending_tokens,
            "popular": popular_tokens,
            "new": new_tokens,
            "success": True,
            "timestamp": current_time,
            "source": "python_api_cached"
        }
        
        # 更新缓存
        cache["home_data"]["data"] = result
        cache["home_data"]["timestamp"] = current_time
        
        # 保存到磁盘
        save_cache_to_disk("home_data")
        
        logger.info(f"Home data cache updated with {len(tokens)} tokens")
        return True
    except Exception as e:
        logger.error(f"Error updating home_data cache: {str(e)}")
        return False

# 更新Ave API数据缓存
def update_ave_data_cache():
    try:
        logger.info("Updating Ave API cache in background")
        
        # 尝试获取热门主题数据
        response = requests.get(
            "https://prod.ave-api.com/v2/ranks?topic=hot",
            headers={
                "Accept": "*/*",
                "X-API-KEY": "NMUuJmYHJB6d91bIpgLqpuLLKYVws82lj0PeDP3UEb19FoyWFJUVGLsgE95XTEmA"
            },
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get("status") == 1 and data.get("data"):
                tokens = []
                
                for token in data["data"]:
                    # 提取并格式化代币信息
                    token_name = token.get("symbol", "Unknown")
                    try:
                        if token.get("appendix"):
                            appendix_data = json.loads(token["appendix"])
                            if appendix_data.get("tokenName"):
                                token_name = appendix_data["tokenName"]
                    except:
                        pass
                    
                    formatted_token = {
                        "name": token_name,
                        "symbol": token.get("symbol", "Unknown"),
                        "address": token.get("token", ""),
                        "logo": token.get("logo_url"),
                        "price": float(token.get("current_price_usd", 0)),
                        "chain": token.get("chain", "ethereum"),
                        "price_change_24h": float(token.get("price_change_24h", 0)),
                        "volume_24h": float(token.get("tx_volume_u_24h", 0)),
                        "market_cap": token.get("market_cap"),
                        "holders": int(token.get("holders", 0))
                    }
                    tokens.append(formatted_token)
                
                # 更新缓存
                current_time = time.time()
                cache["ave_data"]["data"] = {
                    "tokens": tokens,
                    "count": len(tokens),
                    "success": True,
                    "timestamp": current_time,
                    "source": "ave_api"
                }
                cache["ave_data"]["timestamp"] = current_time
                
                # 保存到磁盘
                save_cache_to_disk("ave_data")
                logger.info(f"Ave API cache updated with {len(tokens)} tokens")
                return True
        
        logger.warning(f"Failed to update Ave API cache: HTTP {response.status_code}")
        return False
    except Exception as e:
        logger.error(f"Error updating Ave API cache: {str(e)}")
        return False

@app.route('/api/token-boosts', methods=['GET'])
def get_token_boosts():
    """Fetch token boosts data from DexScreener and return formatted results"""
    try:
        # 检查缓存是否有效
        if is_cache_valid("token_boosts"):
            logger.info("Returning cached token boosts data")
            return jsonify(cache["token_boosts"]["data"])
        
        # 尝试更新缓存
        try:
            logger.info("Fetching fresh token boosts data from DexScreener")
            response = requests.get(
                "https://api.dexscreener.com/token-boosts/top/v1",
                headers={"Accept": "*/*"},
                timeout=10
            )
            
            # 对非200响应抛出异常
            response.raise_for_status()
            
            # 解析JSON响应
            data = response.json()
            
            # 提取并格式化相关代币信息
            tokens = []
            if "data" in data:
                for token in data["data"]:
                    formatted_token = {
                        "name": token.get("name", "Unknown"),
                        "symbol": token.get("symbol", "Unknown"),
                        "address": token.get("address", ""),
                        "logo": token.get("logo"),
                        "price": token.get("price", {}).get("usd"),
                        "chain": token.get("chain", "ethereum")
                    }
                    tokens.append(formatted_token)
            
            # 创建响应对象
            current_time = time.time()
            result = {
                "tokens": tokens,
                "count": len(tokens),
                "success": True,
                "timestamp": current_time
            }
            
            # 更新缓存
            cache["token_boosts"]["data"] = result
            cache["token_boosts"]["timestamp"] = current_time
                
            # 保存到磁盘
            save_cache_to_disk("token_boosts")
            
            return jsonify(result)
        
        except Exception as e:
            # 如果更新失败但有旧缓存，返回旧缓存
            if cache["token_boosts"]["data"] is not None:
                logger.warning(f"Failed to update token_boosts data, using stale cache: {str(e)}")
                return jsonify({
                    **cache["token_boosts"]["data"],
                    "stale": True,
                    "stale_reason": str(e)
                })
            # 否则抛出异常
            raise e
    
    except requests.RequestException as e:
        logger.error(f"Error fetching data from DexScreener API: {str(e)}")
        
        # 检查是否有任何缓存可用
        if cache["token_boosts"]["data"] is not None:
            logger.info("Returning stale token_boosts cache after API error")
            return jsonify({
                **cache["token_boosts"]["data"],
                "stale": True,
                "stale_reason": str(e)
            })
            
        return jsonify({
            "success": False,
            "error": "Failed to fetch data from external API",
            "message": str(e)
        }), 500
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        
        # 检查是否有任何缓存可用
        if cache["token_boosts"]["data"] is not None:
            logger.info("Returning stale token_boosts cache after unexpected error")
            return jsonify({
                **cache["token_boosts"]["data"],
                "stale": True,
                "stale_reason": "Internal server error"
            })
            
        return jsonify({
            "success": False,
            "error": "Internal server error",
            "message": str(e)
        }), 500

@app.route('/api/home', methods=['GET'])
def get_home_data():
    """Provide comprehensive home data including trending, popular, and new tokens"""
    try:
        # 检查缓存是否有效
        if is_cache_valid("home_data"):
            logger.info("Returning cached home data")
            return jsonify(cache["home_data"]["data"])
        
        # 缓存无效，尝试更新
        tokens = []
        
        # 首先尝试使用Ave API数据
        if is_cache_valid("ave_data") and cache["ave_data"]["data"]:
            logger.info("Using Ave API data for home tokens")
            tokens = cache["ave_data"]["data"]["tokens"]
        # 如果没有Ave数据，尝试使用token_boosts数据
        elif is_cache_valid("token_boosts") and cache["token_boosts"]["data"]:
            logger.info("Using token_boosts data for home tokens")
            tokens = cache["token_boosts"]["data"]["tokens"]
        else:
            # 尝试获取新数据
            try:
                # 先尝试更新Ave数据
                if update_ave_data_cache() and cache["ave_data"]["data"]:
                    tokens = cache["ave_data"]["data"]["tokens"]
                # 然后尝试更新token_boosts
                elif update_token_boosts_cache() and cache["token_boosts"]["data"]:
                    tokens = cache["token_boosts"]["data"]["tokens"]
                else:
                    # 使用fallback数据
                    tokens = get_fallback_tokens()
            except Exception as inner_e:
                logger.warning(f"Failed to update caches: {str(inner_e)}")
                
                # 检查是否有旧缓存可用
                if cache["ave_data"]["data"]:
                    tokens = cache["ave_data"]["data"]["tokens"]
                elif cache["token_boosts"]["data"]:
                    tokens = cache["token_boosts"]["data"]["tokens"]
                else:
                    tokens = get_fallback_tokens()
        
        # 创建分段数据集
        trending_tokens = tokens[:10] if len(tokens) >= 10 else tokens
        
        # 按价格排序获取高价值代币
        popular_tokens = sorted(tokens, key=lambda x: x.get("price", 0) or 0, reverse=True)
        popular_tokens = popular_tokens[:15] if len(popular_tokens) >= 15 else popular_tokens
        
        # 使用最后的代币作为"新"代币
        new_tokens = tokens[-20:] if len(tokens) >= 20 else tokens
        
        # 创建响应对象
        current_time = time.time()
        result = {
            "tokens": tokens,
            "count": len(tokens),
            "trending": trending_tokens,
            "popular": popular_tokens,
            "new": new_tokens,
            "success": True,
            "timestamp": current_time,
            "source": "python_api"
        }
        
        # 更新缓存
        cache["home_data"]["data"] = result
        cache["home_data"]["timestamp"] = current_time
        
        # 保存到磁盘
        save_cache_to_disk("home_data")
        
        logger.info(f"Home data prepared with {len(tokens)} tokens")
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error in get_home_data: {str(e)}")
        
        # 检查是否有任何缓存可用
        if cache["home_data"]["data"] is not None:
            logger.info("Returning stale home_data cache after error")
            return jsonify({
                **cache["home_data"]["data"],
                "stale": True,
                "stale_reason": str(e)
            })
            
        return jsonify({
            "success": False,
            "error": "Failed to prepare home data",
            "message": str(e)
        }), 500

def get_fallback_tokens():
    """Generate fallback token data when API calls fail"""
    logger.info("Generating fallback token data")
    
    fallback_tokens = [
        {
            "name": "Bitcoin",
            "symbol": "BTC",
            "address": "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
            "logo": "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
            "price": 62541.23,
            "chain": "ethereum"
        },
        {
            "name": "Ethereum",
            "symbol": "ETH",
            "address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
            "logo": "https://cryptologos.cc/logos/ethereum-eth-logo.png",
            "price": 3458.92,
            "chain": "ethereum"
        },
        {
            "name": "Binance Coin",
            "symbol": "BNB",
            "address": "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
            "logo": "https://cryptologos.cc/logos/bnb-bnb-logo.png",
            "price": 598.47,
            "chain": "binance-smart-chain"
        },
        {
            "name": "Solana",
            "symbol": "SOL",
            "address": "So11111111111111111111111111111111111111112",
            "logo": "https://cryptologos.cc/logos/solana-sol-logo.png",
            "price": 142.37,
            "chain": "solana"
        },
        {
            "name": "XRP",
            "symbol": "XRP",
            "address": "native",
            "logo": "https://cryptologos.cc/logos/xrp-xrp-logo.png",
            "price": 0.5023,
            "chain": "ripple"
        }
    ]
    
    return fallback_tokens

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": time.time(),
        "cache_status": {
            "token_boosts": {
                "valid": is_cache_valid("token_boosts"),
                "age_seconds": int(time.time() - cache["token_boosts"]["timestamp"]) if cache["token_boosts"]["timestamp"] > 0 else -1
            },
            "home_data": {
                "valid": is_cache_valid("home_data"),
                "age_seconds": int(time.time() - cache["home_data"]["timestamp"]) if cache["home_data"]["timestamp"] > 0 else -1
            },
            "ave_data": {
                "valid": is_cache_valid("ave_data"),
                "age_seconds": int(time.time() - cache["ave_data"]["timestamp"]) if cache["ave_data"]["timestamp"] > 0 else -1
            }
        }
    })

@app.route('/api/cache/status', methods=['GET'])
def cache_status():
    """Return detailed cache status information"""
    return jsonify({
        "timestamp": time.time(),
        "caches": {
            "token_boosts": {
                "valid": is_cache_valid("token_boosts"),
                "age_seconds": int(time.time() - cache["token_boosts"]["timestamp"]) if cache["token_boosts"]["timestamp"] > 0 else -1,
                "expires_in": int(CACHE_EXPIRY["token_boosts"] - (time.time() - cache["token_boosts"]["timestamp"])) if cache["token_boosts"]["timestamp"] > 0 else -1,
                "has_data": cache["token_boosts"]["data"] is not None,
                "token_count": len(cache["token_boosts"]["data"]["tokens"]) if cache["token_boosts"]["data"] and "tokens" in cache["token_boosts"]["data"] else 0
            },
            "home_data": {
                "valid": is_cache_valid("home_data"),
                "age_seconds": int(time.time() - cache["home_data"]["timestamp"]) if cache["home_data"]["timestamp"] > 0 else -1,
                "expires_in": int(CACHE_EXPIRY["home_data"] - (time.time() - cache["home_data"]["timestamp"])) if cache["home_data"]["timestamp"] > 0 else -1,
                "has_data": cache["home_data"]["data"] is not None,
                "token_count": len(cache["home_data"]["data"]["tokens"]) if cache["home_data"]["data"] and "tokens" in cache["home_data"]["data"] else 0
            },
            "ave_data": {
                "valid": is_cache_valid("ave_data"),
                "age_seconds": int(time.time() - cache["ave_data"]["timestamp"]) if cache["ave_data"]["timestamp"] > 0 else -1,
                "expires_in": int(CACHE_EXPIRY["ave_data"] - (time.time() - cache["ave_data"]["timestamp"])) if cache["ave_data"]["timestamp"] > 0 else -1,
                "has_data": cache["ave_data"]["data"] is not None,
                "token_count": len(cache["ave_data"]["data"]["tokens"]) if cache["ave_data"]["data"] and "tokens" in cache["ave_data"]["data"] else 0
            }
        }
    })

@app.route('/api/cache/refresh', methods=['POST'])
def refresh_cache():
    """Manually trigger a cache refresh"""
    cache_type = request.args.get('type', 'all')
    
    if cache_type == 'token_boosts' or cache_type == 'all':
        update_token_boosts_cache()
    
    if cache_type == 'home_data' or cache_type == 'all':
        update_home_data_cache()
    
    if cache_type == 'ave_data' or cache_type == 'all':
        update_ave_data_cache()
    
    return jsonify({
        "success": True,
        "message": f"Cache refresh initiated for: {cache_type}",
        "timestamp": time.time()
    })

# 设置定时任务刷新缓存
def setup_scheduled_tasks():
    # 每15分钟更新一次token_boosts
    schedule.every(15).minutes.do(update_token_boosts_cache)
    
    # 每20分钟更新一次home_data
    schedule.every(20).minutes.do(update_home_data_cache)
    
    # 每30分钟更新一次Ave API数据
    schedule.every(30).minutes.do(update_ave_data_cache)
    
    # 启动一个后台线程来运行定时任务
    def run_scheduler():
        while True:
            schedule.run_pending()
            time.sleep(1)
    
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    logger.info("Scheduled cache update tasks initialized")

@app.route('/api/token-details', methods=['GET'])
def get_token_details():
    """获取代币详情信息"""
    try:
        # 获取请求参数
        address = request.args.get('address')
        chain = request.args.get('chain')
        
        if not address or not chain:
            return jsonify({
                "success": False,
                "error": "Missing required parameters: address and chain"
            }), 400
            
        # 构建缓存键
        cache_key = f"token_details_{chain}_{address}"
        
        # 检查缓存
        if cache_key in cache and time.time() - cache[cache_key]["timestamp"] < CACHE_EXPIRY["token_boosts"]:
            logger.info(f"Returning cached token details for {address} on {chain}")
            return jsonify(cache[cache_key]["data"])
            
        # 准备 Ave.ai API 请求
        ave_api_key = "NMUuJmYHJB6d91bIpgLqpuLLKYVws82lj0PeDP3UEb19FoyWFJUVGLsgE95XTEmA"
        headers = {
            "Accept": "*/*",
            "X-API-KEY": ave_api_key
        }
        
        # 发起请求获取代币详情
        token_url = f"https://prod.ave-api.com/v2/tokens?keyword={address}&chain={chain}"
        response = requests.get(token_url, headers=headers, timeout=15)
        
        if response.status_code != 200:
            return jsonify({
                "success": False,
                "error": f"API request failed with status {response.status_code}"
            }), 500
            
        data = response.json()
        
        if data.get("status") != 1 or not data.get("data"):
            return jsonify({
                "success": False,
                "error": "Token not found or invalid API response"
            }), 404
            
        # 解析代币数据
        token_data = data["data"][0]
        
        # 解析额外信息
        appendix_data = {}
        if token_data.get("appendix"):
            try:
                appendix_data = json.loads(token_data["appendix"])
            except:
                logger.warning(f"Failed to parse appendix data for {address}")
        
        # 提取流动性池信息 (这里是模拟数据，实际项目应该从API获取)
        lp_amount = 269
        lock_percent = 99.97
        
        # 准备返回数据
        result = {
            "success": True,
            "symbol": token_data.get("symbol", ""),
            "name": token_data.get("name", ""),
            "address": token_data.get("token", ""),
            "logo": token_data.get("logo_url", ""),
            "price": float(token_data.get("current_price_usd", 0)),
            "priceChange": float(token_data.get("price_change_24h", 0)),
            "priceChange24h": float(token_data.get("price_change_24h", 0)),
            "volume24h": float(token_data.get("tx_volume_u_24h", 0)),
            "marketCap": float(token_data.get("market_cap", 0)),
            "totalSupply": float(token_data.get("total", 0)) / (10 ** int(token_data.get("decimal", 18))),
            "holders": int(token_data.get("holders", 0)),
            "chain": token_data.get("chain", ""),
            "lpAmount": lp_amount,
            "lockPercent": lock_percent,
            "website": appendix_data.get("website", ""),
            "telegram": appendix_data.get("telegram", ""),
            "twitter": appendix_data.get("twitter", ""),
        }
        
        # 更新缓存
        cache[cache_key] = {
            "data": result,
            "timestamp": time.time()
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error fetching token details: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to fetch token details",
            "message": str(e)
        }), 500

@app.route('/api/token-kline', methods=['GET'])
def get_token_kline():
    """获取代币K线数据"""
    try:
        # 获取请求参数
        address = request.args.get('address')
        chain = request.args.get('chain')
        interval = request.args.get('interval', '1d')
        
        if not address or not chain:
            return jsonify({
                "success": False,
                "error": "Missing required parameters: address and chain"
            }), 400
            
        # 构建缓存键
        cache_key = f"token_kline_{chain}_{address}_{interval}"
        
        # 检查缓存
        if cache_key in cache and time.time() - cache[cache_key]["timestamp"] < CACHE_EXPIRY["token_boosts"]:
            logger.info(f"Returning cached kline data for {address} on {chain}")
            return jsonify(cache[cache_key]["data"])
            
        # 这里我们使用模拟数据，实际项目应该从 Ave.ai API 获取
        # Ave.ai 的 API 文档中有 /v2/token/kline 接口可获取K线数据
        
        # 模拟K线数据
        current_price = 0.007354
        kline_data = []
        
        # 生成30天的每日K线数据
        end_time = int(time.time())
        
        for i in range(30):
            day_seconds = 86400
            time_point = end_time - (29 - i) * day_seconds
            
            # 根据时间生成随机价格波动
            random_factor = 0.95 + random.random() * 0.1  # 0.95 到 1.05 之间的随机数
            
            if i == 0:
                base_price = current_price / (1 + random.random() * 0.3)  # 起始价格
            else:
                base_price = kline_data[-1]["close"]
                
            open_price = base_price * (0.98 + random.random() * 0.04)
            close_price = base_price * (0.98 + random.random() * 0.04)
            high_price = max(open_price, close_price) * (1 + random.random() * 0.03)
            low_price = min(open_price, close_price) * (1 - random.random() * 0.03)
            volume = 10000 + random.random() * 90000
            
            kline_data.append({
                "time": time_point,
                "open": round(open_price, 8),
                "high": round(high_price, 8),
                "low": round(low_price, 8),
                "close": round(close_price, 8),
                "volume": round(volume, 2)
            })
        
        result = {
            "success": True,
            "klineData": kline_data,
            "symbol": "BL",
            "chain": chain,
            "interval": interval
        }
        
        # 更新缓存
        cache[cache_key] = {
            "data": result,
            "timestamp": time.time()
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error fetching token kline data: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to fetch token kline data",
            "message": str(e)
        }), 500

@app.route('/api/token-transactions', methods=['GET'])
def get_token_transactions():
    """获取代币交易历史"""
    try:
        # 获取请求参数
        address = request.args.get('address')
        chain = request.args.get('chain')
        limit = int(request.args.get('limit', 20))
        
        if not address or not chain:
            return jsonify({
                "success": False,
                "error": "Missing required parameters: address and chain"
            }), 400
            
        # 构建缓存键
        cache_key = f"token_transactions_{chain}_{address}_{limit}"
        
        # 检查缓存
        if cache_key in cache and time.time() - cache[cache_key]["timestamp"] < CACHE_EXPIRY["token_boosts"]:
            logger.info(f"Returning cached transaction data for {address} on {chain}")
            return jsonify(cache[cache_key]["data"])
        
        # 模拟交易数据
        transactions = [
            { "time": "01:39", "price": "0.00735", "amount": "7,767.464", "total": "57.12", "user": "*df01" },
            { "time": "01:26", "price": "0.00737", "amount": "1,589", "total": "11.703", "user": "*8b28" },
            { "time": "01:25", "price": "0.00737", "amount": "1,980", "total": "14.584", "user": "*832d" },
            { "time": "00:50", "price": "0.00741", "amount": "23,569", "total": "0.175", "user": "*2319" },
            { "time": "00:01", "price": "0.00737", "amount": "82.589", "total": "0.609", "user": "*21fc" },
            { "time": "23:48", "price": "0.00737", "amount": "71.442", "total": "0.526", "user": "*5856(4)" },
            { "time": "23:01", "price": "0.00736", "amount": "110.246", "total": "0.812", "user": "*5637" },
            { "time": "23:00", "price": "0.00737", "amount": "39.96", "total": "0.294", "user": "*26df" },
            { "time": "22:06", "price": "0.00737", "amount": "43.873", "total": "0.323", "user": "*5856(3)" },
            { "time": "20:15", "price": "0.00736", "amount": "47.953", "total": "0.353", "user": "*4a45(2)" },
            { "time": "19:21", "price": "0.0074", "amount": "6.806", "total": "0.0504", "user": "*5856(2)" },
            { "time": "19:21", "price": "0.00736", "amount": "31.426", "total": "0.231", "user": "*4cd0(3)" },
            { "time": "18:26", "price": "0.00736", "amount": "55.044", "total": "0.405", "user": "*2ed2(2)" },
        ]
        
        result = {
            "success": True,
            "transactions": transactions[:limit],
            "total": len(transactions),
            "symbol": "BL",
            "chain": chain
        }
        
        # 更新缓存
        cache[cache_key] = {
            "data": result,
            "timestamp": time.time()
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error fetching token transactions: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to fetch token transactions",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    # 加载持久化缓存
    load_cache_from_disk()
    
    # 立即更新缓存
    background_update_caches()
    
    # 设置定时任务
    setup_scheduled_tasks()
    
    # 启动服务器
    logger.info("Starting API server on port 5000")
    app.run(host='0.0.0.0', port=5000, debug=True) 