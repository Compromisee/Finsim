import random

EVENTS = [
    {'type': 'positive', 'title': 'Anonymous Tip', 'body': 'You received an anonymous tip — +$1,000 cash deposited.', 'effect': {'cash': 1000}},
    {'type': 'positive', 'title': 'Slippage Refund', 'body': 'Your limit order executed at an unexpectedly favorable price.', 'effect': {'cash': 250}},
    {'type': 'positive', 'title': 'Special Dividend', 'body': 'A held position declared a special dividend.', 'effect': {'cash': 500}},
    {'type': 'positive', 'title': 'Sector Bull Run', 'body': 'Tech sector up 8% on AI optimism.', 'effect': {'sector_bonus': 'Tech'}},
    {'type': 'positive', 'title': 'Performance Bonus', 'body': 'Your day job performance triggered a $2,500 bonus.', 'effect': {'cash': 2500}},
    {'type': 'negative', 'title': 'Market Crash', 'body': 'Global recession fears send indices down 12%.', 'effect': {'regime': 'crash'}},
    {'type': 'negative', 'title': 'Margin Call', 'body': 'Your leveraged position requires immediate collateral.', 'effect': {'cash': -1500}},
    {'type': 'negative', 'title': 'Tax Audit', 'body': 'An unexpected $3,000 tax liability has been assessed.', 'effect': {'cash': -3000}},
    {'type': 'negative', 'title': 'Fraud Alert', 'body': '$500 unauthorized charge appeared on your card.', 'effect': {'cash': -500}},
    {'type': 'neutral', 'title': 'Stock Split', 'body': 'A held position announced a 4:1 split.', 'effect': {'split': 4}},
    {'type': 'neutral', 'title': 'Acquisition Offer', 'body': 'A held position received a buyout bid at 30% premium.', 'effect': {'premium': 0.3}},
]

class EventsEngine:
    def generate_random_event(self):
        e = random.choice(EVENTS)
        return {
            'id': random.randint(100000, 999999),
            'type': e['type'],
            'title': e['title'],
            'body': e['body'],
            'effect': e['effect'],
        }