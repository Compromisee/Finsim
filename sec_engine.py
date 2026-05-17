import random
from datetime import datetime, timedelta

class SECEngine:
    def __init__(self, market):
        self.market = market

    def get_filings(self, ticker):
        s = self.market.get_stock(ticker)
        if not s: return []
        filings = []
        today = datetime.utcnow()
        for i in range(8):
            d = today - timedelta(days=random.randint(15, 800))
            ftype = random.choice(['10-K', '10-Q', '10-Q', '10-Q', '8-K', '8-K', 'DEF 14A', 'S-1'])
            filings.append({
                'type': ftype, 'date': d.strftime('%Y-%m-%d'),
                'description': self._desc(ftype, s),
                'pages': random.randint(20, 400),
            })
        return sorted(filings, key=lambda x: x['date'], reverse=True)

    def _desc(self, ftype, s):
        descs = {
            '10-K': f'Annual report for {s["name"]} — revenue, risks, executive compensation',
            '10-Q': f'Quarterly report — financial statements and MD&A',
            '8-K': f'Material event disclosure — could include earnings, M&A, or leadership changes',
            'DEF 14A': f'Proxy statement — shareholder voting and executive comp',
            'S-1': f'Registration statement for security issuance',
        }
        return descs.get(ftype, 'Filing')

    def get_insider_trades(self, ticker):
        s = self.market.get_stock(ticker)
        if not s: return []
        trades = []
        names = ['Tim Cook', 'Sarah Chen', 'David Park', 'Jennifer Wu', 'Michael Reyes', 'Rachel Kim']
        roles = ['CEO', 'CFO', 'CTO', 'Director', 'President', 'EVP']
        for _ in range(random.randint(4, 10)):
            d = datetime.utcnow() - timedelta(days=random.randint(1, 180))
            action = random.choice(['Buy', 'Sell', 'Sell', 'Sell'])
            qty = random.randint(1000, 500_000)
            trades.append({
                'date': d.strftime('%Y-%m-%d'),
                'insider': random.choice(names),
                'role': random.choice(roles),
                'action': action, 'shares': qty,
                'price': s['price'] * random.uniform(0.85, 1.15),
                'value': round(qty * s['price'], 2),
            })
        return sorted(trades, key=lambda x: x['date'], reverse=True)