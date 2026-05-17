import random
from datetime import datetime

NEWS_TEMPLATES = [
    {'cat': 'Geopolitical', 'headline': 'NATO member deploys troops to border, defense stocks surge', 'body': 'Tensions in Eastern Europe escalated overnight. Defense contractors saw immediate pre-market gains.', 'sectors': ['Military'], 'sentiment': 0.6},
    {'cat': 'Geopolitical', 'headline': 'Trade war escalation forces supply chain restructuring', 'body': 'New tariffs announced between major economies. Multinationals scrambling to reroute logistics.', 'sectors': ['Tech', 'Retail'], 'sentiment': -0.5},
    {'cat': 'Economic', 'headline': 'Federal Reserve signals rate pause amid cooling inflation data', 'body': 'Latest CPI print came in softer than expected. Markets rallied on dovish Fed commentary.', 'sectors': ['Finance', 'Real Estate'], 'sentiment': 0.7},
    {'cat': 'Economic', 'headline': 'China GDP misses forecast, global markets react', 'body': 'Q3 growth printed below consensus. Commodity-linked names under pressure.', 'sectors': ['Energy', 'Retail'], 'sentiment': -0.4},
    {'cat': 'Corporate', 'headline': 'CEO scandal leads to board vote, stock halted pending investigation', 'body': 'Allegations surfaced regarding insider transactions. Trading remains suspended.', 'sectors': [], 'sentiment': -0.8},
    {'cat': 'Corporate', 'headline': 'Merger blocked by antitrust regulators, both stocks fall', 'body': 'DOJ filed suit citing competitive harm. Deal premium evaporated in after-hours trading.', 'sectors': ['Tech', 'Finance'], 'sentiment': -0.6},
    {'cat': 'Climate', 'headline': 'Hurricane disrupts Gulf oil production, energy futures spike', 'body': 'Category 4 storm forced evacuation of offshore platforms. Refiners report 15% capacity offline.', 'sectors': ['Energy'], 'sentiment': 0.4},
    {'cat': 'Climate', 'headline': 'Drought conditions threaten agricultural commodity outlook', 'body': 'USDA cut yield estimates for second consecutive month. Food producers warn of margin pressure.', 'sectors': ['Retail'], 'sentiment': -0.3},
    {'cat': 'Tech', 'headline': 'Semiconductor export restrictions tighten, chip stocks volatile', 'body': 'New licensing requirements announced for advanced node exports. Sector mixed on long-term implications.', 'sectors': ['Tech'], 'sentiment': -0.4},
    {'cat': 'Tech', 'headline': 'Major data breach exposes 50M accounts, cybersecurity sector rallies', 'body': 'Breach disclosed late yesterday. Cybersecurity ETF up 6% in pre-market.', 'sectors': ['Tech'], 'sentiment': 0.5},
    {'cat': 'Medical', 'headline': 'Clinical trial results exceed expectations, biotech surges 40%', 'body': 'Phase 3 trial met primary and secondary endpoints. Analyst price targets being revised upward.', 'sectors': ['Biotech', 'Pharma'], 'sentiment': 0.9},
    {'cat': 'Medical', 'headline': 'Drug recall issued after adverse reactions reported in trial', 'body': 'FDA advisory committee recommended voluntary withdrawal. Affected names down sharply.', 'sectors': ['Pharma'], 'sentiment': -0.7},
    {'cat': 'Military', 'headline': 'Defense budget increase announced, aerospace and defense sector leads gains', 'body': 'Congressional appropriation includes 12% increase YoY. Prime contractors expected beneficiaries.', 'sectors': ['Military'], 'sentiment': 0.6},
    {'cat': 'Crypto', 'headline': 'Bitcoin breaks key resistance, crypto-adjacent equities follow', 'body': 'BTC pushed through prior all-time high on heavy volume. Miners and exchanges leading equity gains.', 'sectors': ['Crypto'], 'sentiment': 0.7},
]

class NewsEngine:
    def __init__(self):
        self.items = []
        for _ in range(15):
            self.items.append(self._make_item(random.choice(NEWS_TEMPLATES)))

    def _make_item(self, tmpl):
        return {
            'id': random.randint(100000, 999999),
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'category': tmpl['cat'],
            'headline': tmpl['headline'],
            'body': tmpl['body'],
            'sectors': tmpl['sectors'],
            'sentiment': tmpl['sentiment'],
        }

    def get_latest(self, limit=20):
        return self.items[-limit:][::-1]

    def generate_news_item(self, market=None):
        tmpl = random.choice(NEWS_TEMPLATES)
        item = self._make_item(tmpl)
        self.items.append(item)
        if len(self.items) > 100:
            self.items.pop(0)
        return item