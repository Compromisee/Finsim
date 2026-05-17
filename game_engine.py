import random
import math
from datetime import datetime, timedelta

INDICES_META = [
    {'ticker': 'SP500', 'name': 'S&P 500', 'color': '#ef5350'},
    {'ticker': 'DOW30', 'name': 'Dow Jones', 'color': '#26a69a'},
    {'ticker': 'HANGSENG', 'name': 'Hang Seng', 'color': '#ff6b6b'},
    {'ticker': 'NIKKEI225', 'name': 'Nikkei 225', 'color': '#f59e0b'},
    {'ticker': 'SHANGHAI', 'name': 'Shanghai', 'color': '#26a69a'},
    {'ticker': 'RUT', 'name': 'Russell 2000', 'color': '#a78bfa'},
    {'ticker': 'FTSE', 'name': 'FTSE 100', 'color': '#60a5fa'},
]

SECTOR_META = {
    'Tech': {'icon': 'memory', 'color': '#60a5fa'},
    'Finance': {'icon': 'account_balance', 'color': '#26a69a'},
    'Healthcare': {'icon': 'health_and_safety', 'color': '#ff6b6b'},
    'Biotech': {'icon': 'biotech', 'color': '#a78bfa'},
    'Military': {'icon': 'security', 'color': '#94a3b8'},
    'Energy': {'icon': 'bolt', 'color': '#f59e0b'},
    'Pharma': {'icon': 'medication', 'color': '#f472b6'},
    'Retail': {'icon': 'shopping_bag', 'color': '#fb923c'},
    'Crypto': {'icon': 'currency_bitcoin', 'color': '#fbbf24'},
    'Real Estate': {'icon': 'apartment', 'color': '#34d399'},
}

class MarketEngine:
    def __init__(self, universe):
        self.stocks = {}
        self.regime = 'normal'  # normal, bull, bear, crash, recovery
        self.tick_count = 0
        self.last_tick = datetime.utcnow()
        self.indices = {}
        for s in universe:
            self.add_stock(self._init_stock(s))
        self._init_indices()

    def _init_stock(self, s):
        history = self._seed_history(s['base_price'], s['volatility'], 200)
        current = history[-1]
        prev = history[-2] if len(history) > 1 else current
        return {
            'ticker': s['ticker'],
            'name': s['name'],
            'sector': s['sector'],
            'price': round(current, 2),
            'base_price': s['base_price'],
            'volatility': s['volatility'],
            'beta': s.get('beta', 1.0),
            'history': [round(h, 2) for h in history],
            'volume': random.randint(500000, 50000000),
            'avg_volume': random.randint(1000000, 30000000),
            'market_cap': current * random.randint(10_000_000, 5_000_000_000),
            'pe': round(random.uniform(8, 45), 2),
            'eps': round(random.uniform(0.5, 18), 2),
            'dividend': round(random.uniform(0, 4), 2),
            'high_52': round(max(history), 2),
            'low_52': round(min(history), 2),
            'open': round(history[-2], 2) if len(history) > 1 else current,
            'high': round(max(history[-20:]), 2),
            'low': round(min(history[-20:]), 2),
            'change': round(current - prev, 2),
            'change_pct': round((current - prev) / prev * 100, 2),
            'risk': 'High' if s['volatility'] > 0.04 else 'Medium' if s['volatility'] > 0.022 else 'Low',
            'description': s.get('description', ''),
        }

    def _seed_history(self, base, vol, n):
        prices = [base]
        for _ in range(n - 1):
            drift = 0.0001
            shock = random.gauss(0, vol)
            new_price = prices[-1] * math.exp(drift + shock)
            prices.append(max(0.5, new_price))
        return prices

    def _init_indices(self):
        seeds = {
            'SP500': 6174.39, 'DOW30': 48172.81, 'HANGSENG': 25183.57,
            'NIKKEI225': 49142.15, 'SHANGHAI': 3829.23, 'RUT': 2514.92, 'FTSE': 9624.89
        }
        for meta in INDICES_META:
            t = meta['ticker']
            base = seeds[t]
            history = self._seed_history(base, 0.008, 200)
            current = history[-1]
            prev = history[-2]
            self.indices[t] = {
                **meta,
                'price': round(current, 2),
                'history': [round(h, 2) for h in history],
                'change': round(current - prev, 2),
                'change_pct': round((current - prev) / prev * 100, 2),
                'open': round(history[-2], 2),
                'high': round(max(history[-30:]), 2),
                'low': round(min(history[-30:]), 2),
            }

    def add_stock(self, stock):
        if 'history' not in stock or not stock['history']:
            stock = self._init_stock(stock)
        self.stocks[stock['ticker']] = stock

    def get_stock(self, ticker):
        return self.stocks.get(ticker)

    def get_all_stocks(self):
        return list(self.stocks.values())

    def get_indices(self):
        return list(self.indices.values())

    def get_sectors(self):
        sector_data = {}
        for s in self.stocks.values():
            sec = s['sector']
            if sec not in sector_data:
                sector_data[sec] = {
                    'name': sec,
                    'icon': SECTOR_META.get(sec, {}).get('icon', 'category'),
                    'color': SECTOR_META.get(sec, {}).get('color', '#94a3b8'),
                    'market_cap': 0,
                    'stocks': 0,
                    'ytd_change': 0,
                }
            sector_data[sec]['market_cap'] += s['market_cap']
            sector_data[sec]['stocks'] += 1
            sector_data[sec]['ytd_change'] += s['change_pct']
        total_cap = sum(d['market_cap'] for d in sector_data.values())
        results = []
        for sec, d in sector_data.items():
            d['weight'] = round(d['market_cap'] / total_cap * 100, 2) if total_cap else 0
            d['ytd_change'] = round(d['ytd_change'] / d['stocks'], 2)
            d['market_cap_t'] = round(d['market_cap'] / 1e12, 3)
            results.append(d)
        results.sort(key=lambda x: x['weight'], reverse=True)
        return results

    def get_history(self, ticker, timeframe):
        stock = self.stocks.get(ticker)
        if not stock:
            return []
        full = stock['history']
        slices = {'1D': 24, '1W': 50, '3M': 90, '6M': 130, 'YTD': 160, '1Y': 180, '2Y': 200, 'ALL': 200}
        n = slices.get(timeframe, 100)
        return full[-n:]

    def tick(self):
        now = datetime.utcnow()
        if (now - self.last_tick).total_seconds() < 1:
            return
        self.last_tick = now
        self.tick_count += 1

        regime_mult = {'normal': 1.0, 'bull': 1.5, 'bear': -0.8, 'crash': -3.0, 'recovery': 0.8}
        rm = regime_mult.get(self.regime, 1.0)

        for s in self.stocks.values():
            drift = 0.0001 * rm
            shock = random.gauss(0, s['volatility'])
            new_price = s['price'] * math.exp(drift + shock)
            new_price = max(0.5, new_price)
            s['history'].append(round(new_price, 2))
            if len(s['history']) > 500:
                s['history'].pop(0)
            prev = s['price']
            s['price'] = round(new_price, 2)
            s['change'] = round(new_price - s['open'], 2)
            s['change_pct'] = round((new_price - s['open']) / s['open'] * 100, 2) if s['open'] else 0
            s['volume'] += random.randint(1000, 100000)

        for idx in self.indices.values():
            shock = random.gauss(0, 0.004)
            new = idx['price'] * math.exp(shock)
            idx['history'].append(round(new, 2))
            if len(idx['history']) > 500:
                idx['history'].pop(0)
            idx['change'] = round(new - idx['open'], 2)
            idx['change_pct'] = round((new - idx['open']) / idx['open'] * 100, 2)
            idx['price'] = round(new, 2)

        # Occasionally shift regime
        if random.random() < 0.001:
            self.regime = random.choice(['normal', 'normal', 'normal', 'bull', 'bear', 'recovery'])