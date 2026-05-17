import random, math
from datetime import datetime

CRYPTO_LIST = [
    {'symbol': 'BTC', 'name': 'Bitcoin', 'base': 67_000, 'vol': 0.04, 'stake_apy': 0.0},
    {'symbol': 'ETH', 'name': 'Ethereum', 'base': 3_200, 'vol': 0.05, 'stake_apy': 4.5},
    {'symbol': 'SOL', 'name': 'Solana', 'base': 182, 'vol': 0.07, 'stake_apy': 7.2},
    {'symbol': 'BNB', 'name': 'BNB', 'base': 612, 'vol': 0.045, 'stake_apy': 2.1},
    {'symbol': 'XRP', 'name': 'Ripple', 'base': 0.58, 'vol': 0.06, 'stake_apy': 0.0},
    {'symbol': 'ADA', 'name': 'Cardano', 'base': 0.47, 'vol': 0.06, 'stake_apy': 3.8},
    {'symbol': 'DOGE', 'name': 'Dogecoin', 'base': 0.16, 'vol': 0.085, 'stake_apy': 0.0},
    {'symbol': 'AVAX', 'name': 'Avalanche', 'base': 38.5, 'vol': 0.07, 'stake_apy': 8.5},
    {'symbol': 'DOT', 'name': 'Polkadot', 'base': 7.2, 'vol': 0.06, 'stake_apy': 14.2},
    {'symbol': 'MATIC', 'name': 'Polygon', 'base': 0.52, 'vol': 0.07, 'stake_apy': 5.3},
    {'symbol': 'LINK', 'name': 'Chainlink', 'base': 16.4, 'vol': 0.065, 'stake_apy': 4.8},
    {'symbol': 'LTC', 'name': 'Litecoin', 'base': 73.2, 'vol': 0.05, 'stake_apy': 0.0},
    {'symbol': 'UNI', 'name': 'Uniswap', 'base': 8.4, 'vol': 0.07, 'stake_apy': 0.0},
    {'symbol': 'ATOM', 'name': 'Cosmos', 'base': 8.1, 'vol': 0.065, 'stake_apy': 18.5},
    {'symbol': 'SHIB', 'name': 'Shiba Inu', 'base': 0.0000243, 'vol': 0.10, 'stake_apy': 0.0},
]

class CryptoEngine:
    def __init__(self):
        self.coins = {}
        for c in CRYPTO_LIST:
            hist = self._seed(c['base'], c['vol'], 200)
            self.coins[c['symbol']] = {
                **c,
                'price': round(hist[-1], 8 if c['base'] < 1 else 2),
                'history': hist,
                'change_24h': round((hist[-1] - hist[-24])/hist[-24]*100, 2) if len(hist) > 24 else 0,
                'volume_24h': random.randint(100_000_000, 30_000_000_000),
                'market_cap': hist[-1] * random.randint(10_000_000, 500_000_000),
                'high_24h': round(max(hist[-24:]), 8 if c['base']<1 else 2),
                'low_24h': round(min(hist[-24:]), 8 if c['base']<1 else 2),
            }

    def _seed(self, base, vol, n):
        prices = [base]
        for _ in range(n-1):
            shock = random.gauss(0, vol)
            new = prices[-1] * math.exp(shock)
            prices.append(max(base*0.05, new))
        return prices

    def tick(self):
        for c in self.coins.values():
            shock = random.gauss(0, c['vol'])
            new = c['price'] * math.exp(shock)
            new = max(c['base']*0.05, new)
            c['history'].append(new)
            if len(c['history']) > 500: c['history'].pop(0)
            c['price'] = round(new, 8 if c['base']<1 else 2)
            if len(c['history']) > 24:
                c['change_24h'] = round((new - c['history'][-24])/c['history'][-24]*100, 2)

    def get_all(self): return list(self.coins.values())
    def get(self, sym): return self.coins.get(sym)

    def stake(self, data):
        sym = data['symbol']; amount = float(data['amount'])
        c = self.coins.get(sym)
        if not c: return {'error': 'Not found'}
        if c['stake_apy'] <= 0: return {'error': 'Not stakeable'}
        return {
            'success': True, 'symbol': sym, 'amount': amount,
            'apy': c['stake_apy'],
            'daily_reward': round(amount * (c['stake_apy']/100/365), 8 if c['base']<1 else 4),
        }