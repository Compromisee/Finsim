import random, math

PAIRS = [
    {'pair': 'EUR/USD', 'base': 1.0852, 'vol': 0.003},
    {'pair': 'GBP/USD', 'base': 1.2715, 'vol': 0.0035},
    {'pair': 'USD/JPY', 'base': 152.30, 'vol': 0.004},
    {'pair': 'USD/CHF', 'base': 0.8920, 'vol': 0.003},
    {'pair': 'AUD/USD', 'base': 0.6580, 'vol': 0.0035},
    {'pair': 'USD/CAD', 'base': 1.3850, 'vol': 0.003},
    {'pair': 'NZD/USD', 'base': 0.6050, 'vol': 0.004},
    {'pair': 'EUR/GBP', 'base': 0.8540, 'vol': 0.0025},
    {'pair': 'EUR/JPY', 'base': 165.30, 'vol': 0.004},
    {'pair': 'GBP/JPY', 'base': 193.65, 'vol': 0.0045},
    {'pair': 'USD/CNY', 'base': 7.2450, 'vol': 0.002},
    {'pair': 'USD/MXN', 'base': 17.85, 'vol': 0.006},
]

class ForexEngine:
    def __init__(self):
        self.pairs = {}
        for p in PAIRS:
            h = self._seed(p['base'], p['vol'], 150)
            self.pairs[p['pair']] = {
                **p, 'price': round(h[-1], 4),
                'history': h, 'spread': round(p['base']*0.0001, 5),
                'change_24h': round((h[-1] - h[-24])/h[-24]*100, 2),
            }

    def _seed(self, base, vol, n):
        out = [base]
        for _ in range(n-1):
            out.append(out[-1] * math.exp(random.gauss(0, vol)))
        return out

    def tick(self):
        for p in self.pairs.values():
            new = p['price'] * math.exp(random.gauss(0, p['vol']))
            p['history'].append(new)
            if len(p['history']) > 300: p['history'].pop(0)
            p['price'] = round(new, 4)
            if len(p['history']) > 24:
                p['change_24h'] = round((new - p['history'][-24])/p['history'][-24]*100, 2)

    def get_all(self): return list(self.pairs.values())

    def trade(self, data):
        pair = data['pair']; lots = float(data['lots']); side = data['side']
        leverage = int(data.get('leverage', 1))
        p = self.pairs.get(pair)
        if not p: return {'error': 'Not found'}
        notional = lots * 100_000
        margin = notional / leverage
        return {
            'success': True, 'pair': pair, 'side': side, 'lots': lots,
            'leverage': leverage, 'entry': p['price'], 'notional': notional,
            'margin_required': round(margin, 2),
        }