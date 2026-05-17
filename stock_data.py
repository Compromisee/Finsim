import random

STOCK_UNIVERSE = [
    # Tech
    {'ticker': 'AAPL', 'name': 'Apple Inc.', 'sector': 'Tech', 'base_price': 274.10, 'volatility': 0.022, 'beta': 1.2},
    {'ticker': 'MSFT', 'name': 'Microsoft Corp.', 'sector': 'Tech', 'base_price': 421.50, 'volatility': 0.020, 'beta': 1.0},
    {'ticker': 'GOOGL', 'name': 'Alphabet Inc.', 'sector': 'Tech', 'base_price': 178.20, 'volatility': 0.024, 'beta': 1.1},
    {'ticker': 'AMZN', 'name': 'Amazon.com Inc.', 'sector': 'Tech', 'base_price': 215.40, 'volatility': 0.028, 'beta': 1.3},
    {'ticker': 'META', 'name': 'Meta Platforms', 'sector': 'Tech', 'base_price': 562.30, 'volatility': 0.030, 'beta': 1.4},
    {'ticker': 'NVDA', 'name': 'NVIDIA Corp.', 'sector': 'Tech', 'base_price': 174.39, 'volatility': 0.045, 'beta': 1.8},
    {'ticker': 'TSLA', 'name': 'Tesla, Inc.', 'sector': 'Tech', 'base_price': 183.57, 'volatility': 0.055, 'beta': 2.0},
    {'ticker': 'AVGO', 'name': 'Broadcom, Inc.', 'sector': 'Tech', 'base_price': 922.84, 'volatility': 0.032, 'beta': 1.5},
    {'ticker': 'ORCL', 'name': 'Oracle Corp.', 'sector': 'Tech', 'base_price': 165.40, 'volatility': 0.022, 'beta': 1.0},
    {'ticker': 'CRM', 'name': 'Salesforce Inc.', 'sector': 'Tech', 'base_price': 312.80, 'volatility': 0.028, 'beta': 1.3},
    {'ticker': 'ADBE', 'name': 'Adobe Inc.', 'sector': 'Tech', 'base_price': 510.20, 'volatility': 0.026, 'beta': 1.2},
    {'ticker': 'INTC', 'name': 'Intel Corp.', 'sector': 'Tech', 'base_price': 24.50, 'volatility': 0.035, 'beta': 1.4},
    {'ticker': 'AMD', 'name': 'Advanced Micro Devices', 'sector': 'Tech', 'base_price': 142.30, 'volatility': 0.042, 'beta': 1.7},

    # Finance
    {'ticker': 'JPM', 'name': 'JPMorgan Chase', 'sector': 'Finance', 'base_price': 234.50, 'volatility': 0.018, 'beta': 1.1},
    {'ticker': 'BAC', 'name': 'Bank of America', 'sector': 'Finance', 'base_price': 46.80, 'volatility': 0.020, 'beta': 1.2},
    {'ticker': 'GS', 'name': 'Goldman Sachs', 'sector': 'Finance', 'base_price': 580.20, 'volatility': 0.022, 'beta': 1.3},
    {'ticker': 'WFC', 'name': 'Wells Fargo', 'sector': 'Finance', 'base_price': 73.40, 'volatility': 0.020, 'beta': 1.1},
    {'ticker': 'MS', 'name': 'Morgan Stanley', 'sector': 'Finance', 'base_price': 128.90, 'volatility': 0.022, 'beta': 1.3},
    {'ticker': 'V', 'name': 'Visa Inc.', 'sector': 'Finance', 'base_price': 310.50, 'volatility': 0.016, 'beta': 0.9},
    {'ticker': 'MA', 'name': 'Mastercard Inc.', 'sector': 'Finance', 'base_price': 512.30, 'volatility': 0.016, 'beta': 0.9},

    # Healthcare
    {'ticker': 'JNJ', 'name': 'Johnson & Johnson', 'sector': 'Healthcare', 'base_price': 158.20, 'volatility': 0.014, 'beta': 0.7},
    {'ticker': 'UNH', 'name': 'UnitedHealth Group', 'sector': 'Healthcare', 'base_price': 562.40, 'volatility': 0.018, 'beta': 0.8},
    {'ticker': 'LLY', 'name': 'Eli Lilly & Co.', 'sector': 'Healthcare', 'base_price': 812.50, 'volatility': 0.024, 'beta': 0.9},
    {'ticker': 'ABBV', 'name': 'AbbVie Inc.', 'sector': 'Healthcare', 'base_price': 178.30, 'volatility': 0.018, 'beta': 0.8},

    # Biotech
    {'ticker': 'MRNA', 'name': 'Moderna Inc.', 'sector': 'Biotech', 'base_price': 42.80, 'volatility': 0.052, 'beta': 1.6},
    {'ticker': 'BNTX', 'name': 'BioNTech SE', 'sector': 'Biotech', 'base_price': 108.50, 'volatility': 0.048, 'beta': 1.5},
    {'ticker': 'REGN', 'name': 'Regeneron Pharma', 'sector': 'Biotech', 'base_price': 1042.20, 'volatility': 0.028, 'beta': 1.0},
    {'ticker': 'GILD', 'name': 'Gilead Sciences', 'sector': 'Biotech', 'base_price': 92.40, 'volatility': 0.022, 'beta': 0.8},
    {'ticker': 'AMGN', 'name': 'Amgen Inc.', 'sector': 'Biotech', 'base_price': 325.20, 'volatility': 0.020, 'beta': 0.9},

    # Military / Defense
    {'ticker': 'LMT', 'name': 'Lockheed Martin', 'sector': 'Military', 'base_price': 562.30, 'volatility': 0.018, 'beta': 0.7},
    {'ticker': 'RTX', 'name': 'RTX Corp.', 'sector': 'Military', 'base_price': 124.50, 'volatility': 0.018, 'beta': 0.8},
    {'ticker': 'NOC', 'name': 'Northrop Grumman', 'sector': 'Military', 'base_price': 512.80, 'volatility': 0.018, 'beta': 0.7},
    {'ticker': 'GD', 'name': 'General Dynamics', 'sector': 'Military', 'base_price': 298.40, 'volatility': 0.018, 'beta': 0.7},
    {'ticker': 'BA', 'name': 'Boeing Co.', 'sector': 'Military', 'base_price': 178.50, 'volatility': 0.032, 'beta': 1.4},

    # Energy
    {'ticker': 'XOM', 'name': 'Exxon Mobil', 'sector': 'Energy', 'base_price': 118.30, 'volatility': 0.024, 'beta': 1.0},
    {'ticker': 'CVX', 'name': 'Chevron Corp.', 'sector': 'Energy', 'base_price': 162.40, 'volatility': 0.022, 'beta': 1.0},
    {'ticker': 'COP', 'name': 'ConocoPhillips', 'sector': 'Energy', 'base_price': 108.50, 'volatility': 0.026, 'beta': 1.2},
    {'ticker': 'PLUG', 'name': 'Plug Power Inc.', 'sector': 'Energy', 'base_price': 39.23, 'volatility': 0.062, 'beta': 2.1},

    # Pharma
    {'ticker': 'PFE', 'name': 'Pfizer Inc.', 'sector': 'Pharma', 'base_price': 26.40, 'volatility': 0.020, 'beta': 0.7},
    {'ticker': 'MRK', 'name': 'Merck & Co.', 'sector': 'Pharma', 'base_price': 102.30, 'volatility': 0.018, 'beta': 0.7},
    {'ticker': 'BMY', 'name': 'Bristol-Myers Squibb', 'sector': 'Pharma', 'base_price': 56.80, 'volatility': 0.020, 'beta': 0.7},

    # Retail
    {'ticker': 'WMT', 'name': 'Walmart Inc.', 'sector': 'Retail', 'base_price': 92.40, 'volatility': 0.014, 'beta': 0.5},
    {'ticker': 'COST', 'name': 'Costco Wholesale', 'sector': 'Retail', 'base_price': 912.50, 'volatility': 0.016, 'beta': 0.7},
    {'ticker': 'TGT', 'name': 'Target Corp.', 'sector': 'Retail', 'base_price': 132.40, 'volatility': 0.022, 'beta': 0.9},
    {'ticker': 'HD', 'name': 'Home Depot', 'sector': 'Retail', 'base_price': 412.30, 'volatility': 0.018, 'beta': 1.0},

    # Crypto-related
    {'ticker': 'COIN', 'name': 'Coinbase Global', 'sector': 'Crypto', 'base_price': 282.40, 'volatility': 0.062, 'beta': 2.2},
    {'ticker': 'MSTR', 'name': 'MicroStrategy', 'sector': 'Crypto', 'base_price': 412.50, 'volatility': 0.068, 'beta': 2.5},
    {'ticker': 'BMNR', 'name': 'Bitmine Immersion', 'sector': 'Crypto', 'base_price': 30.95, 'volatility': 0.075, 'beta': 2.8},
    {'ticker': 'BITF', 'name': 'Bitfarms Ltd.', 'sector': 'Crypto', 'base_price': 2.40, 'volatility': 0.080, 'beta': 2.6},

    # Real Estate
    {'ticker': 'AMT', 'name': 'American Tower', 'sector': 'Real Estate', 'base_price': 218.40, 'volatility': 0.018, 'beta': 0.8},
    {'ticker': 'PLD', 'name': 'Prologis Inc.', 'sector': 'Real Estate', 'base_price': 112.30, 'volatility': 0.020, 'beta': 1.0},
    {'ticker': 'SPG', 'name': 'Simon Property Group', 'sector': 'Real Estate', 'base_price': 178.20, 'volatility': 0.024, 'beta': 1.2},

    # Misc / Movers
    {'ticker': 'BBAI', 'name': 'BigBear.ai Holdings', 'sector': 'Tech', 'base_price': 72.81, 'volatility': 0.060, 'beta': 2.2},
    {'ticker': 'ONDS', 'name': 'Ondas Holdings', 'sector': 'Tech', 'base_price': 42.15, 'volatility': 0.058, 'beta': 2.1},
    {'ticker': 'AAL', 'name': 'American Airlines', 'sector': 'Retail', 'base_price': 14.92, 'volatility': 0.030, 'beta': 1.5},
    {'ticker': 'OPEN', 'name': 'Opendoor Tech', 'sector': 'Real Estate', 'base_price': 24.89, 'volatility': 0.055, 'beta': 2.0},
    {'ticker': 'RIVN', 'name': 'Rivian Automotive', 'sector': 'Tech', 'base_price': 15.67, 'volatility': 0.052, 'beta': 1.9},
    {'ticker': 'DIS', 'name': 'Walt Disney Co.', 'sector': 'Retail', 'base_price': 110.40, 'volatility': 0.020, 'beta': 1.1},
    {'ticker': 'NKE', 'name': 'NIKE, Inc.', 'sector': 'Retail', 'base_price': 78.20, 'volatility': 0.020, 'beta': 1.0},
    {'ticker': 'GIS', 'name': 'General Mills', 'sector': 'Retail', 'base_price': 68.40, 'volatility': 0.014, 'beta': 0.5},
    {'ticker': 'MU', 'name': 'Micron Technology', 'sector': 'Tech', 'base_price': 102.30, 'volatility': 0.034, 'beta': 1.5},
    {'ticker': 'BB', 'name': 'Blackberry, Limited', 'sector': 'Tech', 'base_price': 4.80, 'volatility': 0.040, 'beta': 1.6},
]

SYLLABLES_PRE = ['Quan', 'Neo', 'Hyper', 'Cyber', 'Aero', 'Bio', 'Nova', 'Lumi', 'Vex', 'Cryo', 'Helios', 'Stell', 'Vert', 'Orb', 'Zeta']
SYLLABLES_POST = ['tech', 'corp', 'dyne', 'matic', 'sphere', 'works', 'labs', 'systems', 'genix', 'wave', 'vault', 'core', 'flux', 'forge']
SECTORS = ['Tech', 'Finance', 'Healthcare', 'Biotech', 'Military', 'Energy', 'Pharma', 'Retail', 'Crypto', 'Real Estate']

def generate_fallback_stock():
    import random as r
    name_pre = r.choice(SYLLABLES_PRE)
    name_post = r.choice(SYLLABLES_POST)
    name = f"{name_pre}{name_post.capitalize()}"
    ticker = (name_pre[:2] + name_post[:2]).upper()
    sector = r.choice(SECTORS)
    base_price = round(r.uniform(5, 500), 2)
    volatility = round(r.uniform(0.015, 0.07), 3)
    return {
        'ticker': ticker,
        'name': name,
        'sector': sector,
        'price': base_price,
        'base_price': base_price,
        'volatility': volatility,
        'beta': round(r.uniform(0.5, 2.2), 2),
        'description': f'{name} operates in the {sector} sector.',
        'risk': 'High' if volatility > 0.05 else 'Medium' if volatility > 0.025 else 'Low',
        'history': [base_price] * 100,
        'volume': r.randint(100000, 50000000),
        'market_cap': base_price * r.randint(1000000, 100000000),
        'pe': round(r.uniform(10, 40), 2),
        'eps': round(r.uniform(0.5, 15), 2),
        'dividend': round(r.uniform(0, 4), 2),
        'change': 0,
        'change_pct': 0,
    }