import random

ETF_DEFINITIONS = [
    {'ticker': 'SPY', 'name': 'SPDR S&P 500', 'kind': 'ETF', 'expense': 0.0945, 'category': 'US Equity',
     'holdings': ['AAPL','MSFT','NVDA','GOOGL','AMZN','META','TSLA','BRK.B','JPM','UNH']},
    {'ticker': 'QQQ', 'name': 'Invesco QQQ Trust', 'kind': 'ETF', 'expense': 0.20, 'category': 'Tech',
     'holdings': ['AAPL','MSFT','NVDA','AMZN','META','GOOGL','TSLA','AVGO','COST','ADBE']},
    {'ticker': 'VOO', 'name': 'Vanguard S&P 500', 'kind': 'ETF', 'expense': 0.03, 'category': 'US Equity',
     'holdings': ['AAPL','MSFT','NVDA','GOOGL','AMZN']},
    {'ticker': 'VTI', 'name': 'Vanguard Total Market', 'kind': 'ETF', 'expense': 0.03, 'category': 'US Equity'},
    {'ticker': 'IWM', 'name': 'iShares Russell 2000', 'kind': 'ETF', 'expense': 0.19, 'category': 'Small Cap'},
    {'ticker': 'VEA', 'name': 'Vanguard FTSE Developed', 'kind': 'ETF', 'expense': 0.05, 'category': 'Intl'},
    {'ticker': 'VWO', 'name': 'Vanguard Emerging Markets', 'kind': 'ETF', 'expense': 0.08, 'category': 'Intl'},
    {'ticker': 'GLD', 'name': 'SPDR Gold Trust', 'kind': 'ETF', 'expense': 0.40, 'category': 'Commodity'},
    {'ticker': 'SLV', 'name': 'iShares Silver Trust', 'kind': 'ETF', 'expense': 0.50, 'category': 'Commodity'},
    {'ticker': 'XLK', 'name': 'Tech Sector SPDR', 'kind': 'ETF', 'expense': 0.10, 'category': 'Sector'},
    {'ticker': 'XLF', 'name': 'Financial Sector SPDR', 'kind': 'ETF', 'expense': 0.10, 'category': 'Sector'},
    {'ticker': 'XLE', 'name': 'Energy Sector SPDR', 'kind': 'ETF', 'expense': 0.10, 'category': 'Sector'},
    {'ticker': 'XLV', 'name': 'Healthcare Sector SPDR', 'kind': 'ETF', 'expense': 0.10, 'category': 'Sector'},
    {'ticker': 'ARKK', 'name': 'ARK Innovation', 'kind': 'ETF', 'expense': 0.75, 'category': 'Thematic'},
    {'ticker': 'BND', 'name': 'Vanguard Total Bond', 'kind': 'ETF', 'expense': 0.03, 'category': 'Bond'},
    {'ticker': 'FXAIX', 'name': 'Fidelity 500 Index', 'kind': 'Mutual', 'expense': 0.015, 'category': 'US Equity'},
    {'ticker': 'VTSAX', 'name': 'Vanguard Total Stock', 'kind': 'Mutual', 'expense': 0.04, 'category': 'US Equity'},
    {'ticker': 'VFIAX', 'name': 'Vanguard 500 Index', 'kind': 'Mutual', 'expense': 0.04, 'category': 'US Equity'},
    {'ticker': 'FXNAX', 'name': 'Fidelity US Bond', 'kind': 'Mutual', 'expense': 0.025, 'category': 'Bond'},
    {'ticker': 'PRGFX', 'name': 'T.Rowe Growth Stock', 'kind': 'Mutual', 'expense': 0.66, 'category': 'Growth'},
]

class ETFEngine:
    def __init__(self, market):
        self.market = market
        self.funds = {}
        for e in ETF_DEFINITIONS:
            base = random.uniform(50, 500)
            hist = [base]
            for _ in range(199):
                hist.append(hist[-1] * (1 + random.gauss(0.0001, 0.011)))
            self.funds[e['ticker']] = {
                **e, 'price': round(hist[-1], 2), 'history': hist,
                'change_pct': round((hist[-1]-hist[-2])/hist[-2]*100, 2),
                'aum': random.randint(500_000_000, 500_000_000_000),
                'ytd_return': round(random.uniform(-8, 28), 2),
            }

    def get_all(self): return list(self.funds.values())