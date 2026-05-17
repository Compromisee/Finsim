import random
from datetime import datetime, timedelta

class EarningsEngine:
    def __init__(self, market):
        self.market = market
        self.calendar = self._build_calendar()

    def _build_calendar(self):
        tickers = list(self.market.stocks.keys())[:30]
        cal = []
        today = datetime.utcnow()
        for i, t in enumerate(tickers):
            d = today + timedelta(days=random.randint(1, 30))
            s = self.market.get_stock(t)
            cal.append({
                'ticker': t, 'name': s['name'],
                'date': d.strftime('%Y-%m-%d'),
                'time': random.choice(['BMO', 'AMC']),
                'eps_estimate': round(random.uniform(0.5, 8), 2),
                'eps_prev': round(random.uniform(0.5, 8), 2),
                'rev_estimate_b': round(random.uniform(1, 80), 2),
            })
        return cal

    def get_calendar(self): return sorted(self.calendar, key=lambda x: x['date'])

    def release(self, ticker):
        item = next((c for c in self.calendar if c['ticker'] == ticker), None)
        if not item: return {'error': 'Not scheduled'}
        actual_eps = item['eps_estimate'] * random.uniform(0.7, 1.4)
        beat = actual_eps > item['eps_estimate']
        surprise_pct = (actual_eps - item['eps_estimate'])/item['eps_estimate']*100
        # Apply price impact
        s = self.market.get_stock(ticker)
        if s:
            impact = surprise_pct * 0.015
            s['price'] = round(max(0.5, s['price'] * (1 + impact)), 2)
        return {
            'ticker': ticker, 'actual_eps': round(actual_eps, 2),
            'estimate': item['eps_estimate'], 'beat': beat,
            'surprise_pct': round(surprise_pct, 2),
            'price_impact_pct': round(surprise_pct * 1.5, 2),
        }