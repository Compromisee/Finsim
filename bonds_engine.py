import random

BONDS = [
    {'id': 'b1', 'name': 'US Treasury 2Y', 'type': 'Treasury', 'rating': 'AAA', 'yield': 4.65, 'maturity_years': 2, 'face_value': 1000},
    {'id': 'b2', 'name': 'US Treasury 10Y', 'type': 'Treasury', 'rating': 'AAA', 'yield': 4.32, 'maturity_years': 10, 'face_value': 1000},
    {'id': 'b3', 'name': 'US Treasury 30Y', 'type': 'Treasury', 'rating': 'AAA', 'yield': 4.58, 'maturity_years': 30, 'face_value': 1000},
    {'id': 'b4', 'name': 'AAPL Corp 5Y', 'type': 'Corporate', 'rating': 'AA+', 'yield': 5.20, 'maturity_years': 5, 'face_value': 1000},
    {'id': 'b5', 'name': 'MSFT Corp 7Y', 'type': 'Corporate', 'rating': 'AAA', 'yield': 5.05, 'maturity_years': 7, 'face_value': 1000},
    {'id': 'b6', 'name': 'High Yield Junk', 'type': 'Corporate', 'rating': 'BB', 'yield': 9.85, 'maturity_years': 5, 'face_value': 1000},
    {'id': 'b7', 'name': 'NYC Muni 10Y', 'type': 'Municipal', 'rating': 'AA', 'yield': 3.85, 'maturity_years': 10, 'face_value': 1000},
    {'id': 'b8', 'name': 'CA Muni 20Y', 'type': 'Municipal', 'rating': 'AA-', 'yield': 4.10, 'maturity_years': 20, 'face_value': 1000},
    {'id': 'b9', 'name': 'TIPS 10Y', 'type': 'Treasury', 'rating': 'AAA', 'yield': 2.15, 'maturity_years': 10, 'face_value': 1000},
    {'id': 'b10', 'name': 'Emerging Mkt Bond', 'type': 'International', 'rating': 'BBB', 'yield': 7.45, 'maturity_years': 5, 'face_value': 1000},
]

class BondsEngine:
    def get_all(self): return BONDS

    def buy(self, data):
        bid = data['id']; qty = int(data['quantity'])
        bond = next((b for b in BONDS if b['id'] == bid), None)
        if not bond: return {'error': 'Not found'}
        cost = bond['face_value'] * qty
        annual_interest = cost * (bond['yield']/100)
        return {
            'success': True, 'bond': bond, 'quantity': qty, 'cost': cost,
            'annual_interest': round(annual_interest, 2),
            'maturity_payout': cost + annual_interest * bond['maturity_years'],
        }