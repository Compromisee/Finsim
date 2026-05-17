import random
from datetime import datetime

PROPERTIES = [
    {'id': 'p1', 'name': 'Studio Apt - Downtown', 'type': 'Apartment', 'city': 'Austin', 'price': 220_000, 'rent': 1800, 'sqft': 540},
    {'id': 'p2', 'name': '2BR Loft - Midtown', 'type': 'Apartment', 'city': 'Denver', 'price': 380_000, 'rent': 2900, 'sqft': 980},
    {'id': 'p3', 'name': '3BR House - Suburb', 'type': 'House', 'city': 'Phoenix', 'price': 425_000, 'rent': 3200, 'sqft': 1850},
    {'id': 'p4', 'name': '4BR Family Home', 'type': 'House', 'city': 'Charlotte', 'price': 510_000, 'rent': 3700, 'sqft': 2400},
    {'id': 'p5', 'name': 'Luxury Penthouse', 'type': 'Penthouse', 'city': 'Miami', 'price': 1_750_000, 'rent': 12500, 'sqft': 2800},
    {'id': 'p6', 'name': 'Beach Condo', 'type': 'Condo', 'city': 'San Diego', 'price': 890_000, 'rent': 6200, 'sqft': 1450},
    {'id': 'p7', 'name': 'Retail Storefront', 'type': 'Commercial', 'city': 'Chicago', 'price': 1_200_000, 'rent': 9800, 'sqft': 3200},
    {'id': 'p8', 'name': 'Office Suite', 'type': 'Commercial', 'city': 'Seattle', 'price': 2_400_000, 'rent': 18500, 'sqft': 5400},
    {'id': 'p9', 'name': 'Warehouse', 'type': 'Industrial', 'city': 'Dallas', 'price': 1_800_000, 'rent': 14200, 'sqft': 12000},
    {'id': 'p10', 'name': 'Mountain Cabin', 'type': 'Vacation', 'city': 'Aspen', 'price': 1_350_000, 'rent': 8900, 'sqft': 2100},
    {'id': 'p11', 'name': 'Lakefront Villa', 'type': 'Vacation', 'city': 'Lake Tahoe', 'price': 2_100_000, 'rent': 13500, 'sqft': 3400},
    {'id': 'p12', 'name': 'Multifamily 6-unit', 'type': 'Multifamily', 'city': 'Atlanta', 'price': 1_650_000, 'rent': 14500, 'sqft': 7800},
]

class RealEstateEngine:
    def __init__(self):
        self.props = {}
        for p in PROPERTIES:
            self.props[p['id']] = {
                **p, 'current_value': p['price'],
                'appreciation': 0, 'history': [p['price']]*50,
            }

    def tick(self):
        for p in self.props.values():
            change = random.gauss(0.0003, 0.005)
            p['current_value'] = max(p['price']*0.4, p['current_value'] * (1 + change))
            p['current_value'] = round(p['current_value'], 0)
            p['appreciation'] = round((p['current_value']-p['price'])/p['price']*100, 2)
            p['history'].append(p['current_value'])
            if len(p['history']) > 200: p['history'].pop(0)

    def get_all(self): return list(self.props.values())

    def buy(self, data):
        pid = data['id']
        p = self.props.get(pid)
        if not p: return {'error': 'Not found'}
        return {'success': True, 'property': p, 'closing_costs': round(p['current_value']*0.03, 2)}