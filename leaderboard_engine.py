import random
from datetime import datetime

class LeaderboardEngine:
    def __init__(self):
        self.entries = self._seed()

    def _seed(self):
        names = ['NotBuffett', 'MoonTrader', 'DiamondHands', 'BearKing', 'QuantQueen',
                 'StreetWolf', 'AlphaSeeker', 'YieldHunter', 'ShortSage', 'GammaScalper',
                 'HodlMaster', 'BollingerBabe', 'FibonacciFox', 'MarketMaven', 'TickerTanya']
        out = []
        for n in names:
            out.append({
                'name': n, 'net_worth': random.randint(150_000, 25_000_000),
                'gain_pct': round(random.uniform(-15, 380), 2),
                'win_streak': random.randint(0, 24),
                'trades': random.randint(50, 5000),
                'updated': datetime.utcnow().isoformat()+'Z',
            })
        out.sort(key=lambda x: x['net_worth'], reverse=True)
        return out

    def submit(self, data):
        existing = next((e for e in self.entries if e['name'] == data['name']), None)
        if existing:
            existing.update(data)
        else:
            self.entries.append({**data, 'updated': datetime.utcnow().isoformat()+'Z'})
        self.entries.sort(key=lambda x: x['net_worth'], reverse=True)

    def get_top(self, n=50):
        return self.entries[:n]