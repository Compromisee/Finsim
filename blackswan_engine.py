import random

BLACK_SWANS = [
    {'id': 'covid', 'name': 'Global Pandemic', 'severity': -0.35, 'duration': 90, 'sectors_immune': ['Biotech', 'Pharma']},
    {'id': '2008', 'name': '2008 Financial Crisis', 'severity': -0.45, 'duration': 180, 'sectors_immune': []},
    {'id': 'flash', 'name': 'Flash Crash', 'severity': -0.12, 'duration': 1, 'sectors_immune': []},
    {'id': 'dotcom', 'name': 'Dot-com Bubble Burst', 'severity': -0.55, 'duration': 365, 'sectors_immune': ['Energy']},
    {'id': 'war', 'name': 'Major Geopolitical Conflict', 'severity': -0.22, 'duration': 60, 'sectors_immune': ['Military', 'Energy']},
    {'id': 'oil_shock', 'name': 'Oil Supply Shock', 'severity': -0.18, 'duration': 45, 'sectors_immune': ['Energy']},
    {'id': 'cyber', 'name': 'Mass Cyber Attack', 'severity': -0.15, 'duration': 14, 'sectors_immune': []},
    {'id': 'currency', 'name': 'Currency Crisis', 'severity': -0.25, 'duration': 30, 'sectors_immune': []},
]

class BlackSwanEngine:
    def trigger(self, market, force_id=None):
        if force_id:
            event = next((b for b in BLACK_SWANS if b['id'] == force_id), random.choice(BLACK_SWANS))
        else:
            event = random.choice(BLACK_SWANS)
        affected = []
        for s in market.stocks.values():
            if s['sector'] in event['sectors_immune']:
                continue
            impact = event['severity'] * random.uniform(0.7, 1.3)
            s['price'] = round(max(0.5, s['price'] * (1 + impact)), 2)
            affected.append({'ticker': s['ticker'], 'impact_pct': round(impact*100, 2)})
        return {
            'event': event, 'affected_count': len(affected),
            'most_impacted': sorted(affected, key=lambda x: x['impact_pct'])[:5],
        }