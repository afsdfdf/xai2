import { TokenData, RankTopic } from '../types/token';

export const dummyTopics: RankTopic[] = [
  {
    "id": "hot",
    "name_en": "Hot",
    "name_zh": "热门"
  },
  {
    "id": "new",
    "name_en": "New",
    "name_zh": "新币"
  },
  {
    "id": "meme",
    "name_en": "Meme",
    "name_zh": "Meme"
  }
];

export const dummyTokens: TokenData[] = [
  {
    "token": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "chain": "eth",
    "symbol": "USDT",
    "name": "Tether",
    "logo_url": "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
    "current_price_usd": 1.0,
    "price_change_24h": 0.01,
    "tx_volume_u_24h": 50000000,
    "holders": 5000000
  },
  {
    "token": "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
    "chain": "eth",
    "symbol": "BNB",
    "name": "BNB",
    "logo_url": "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
    "current_price_usd": 580.0,
    "price_change_24h": 2.5,
    "tx_volume_u_24h": 10000000,
    "holders": 1000000
  }
]; 