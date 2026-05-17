from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import json, random, time, math
from datetime import datetime, timedelta

from game_engine import MarketEngine
from stock_data import STOCK_UNIVERSE, generate_fallback_stock
from news_engine import NewsEngine
from events_engine import EventsEngine
from options_engine import OptionsEngine
from crypto_engine import CryptoEngine
from realestate_engine import RealEstateEngine
from bonds_engine import BondsEngine
from forex_engine import ForexEngine
from etf_engine import ETFEngine
from career_engine import CareerEngine
from tax_engine import TaxEngine
from earnings_engine import EarningsEngine
from sec_engine import SECEngine
from blackswan_engine import BlackSwanEngine
from leaderboard_engine import LeaderboardEngine
from bot_engine import BotEngine

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

market = MarketEngine(STOCK_UNIVERSE)
news = NewsEngine()
events = EventsEngine()
options = OptionsEngine(market)
crypto = CryptoEngine()
realestate = RealEstateEngine()
bonds = BondsEngine()
forex = ForexEngine()
etfs = ETFEngine(market)
career = CareerEngine()
tax = TaxEngine()
earnings = EarningsEngine(market)
sec = SECEngine(market)
blackswan = BlackSwanEngine()
leaderboard = LeaderboardEngine()
bots = BotEngine(market)

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2"

# ============ ROUTES ============

@app.route('/')
def index():
    return render_template('index.html')

# --- Stocks ---
@app.route('/api/stocks')
def get_stocks():
    market.tick()
    return jsonify(market.get_all_stocks())

@app.route('/api/stock/<ticker>')
def get_stock(ticker):
    stock = market.get_stock(ticker.upper())
    if not stock: return jsonify({'error': 'Not found'}), 404
    return jsonify(stock)

@app.route('/api/stock/<ticker>/history')
def get_stock_history(ticker):
    tf = request.args.get('tf', '1D')
    return jsonify(market.get_history(ticker.upper(), tf))

@app.route('/api/indices')
def get_indices(): return jsonify(market.get_indices())

@app.route('/api/sectors')
def get_sectors(): return jsonify(market.get_sectors())

# --- News & Events ---
@app.route('/api/news')
def get_news():
    limit = int(request.args.get('limit', 20))
    return jsonify(news.get_latest(limit))

@app.route('/api/news/generate', methods=['POST'])
def gen_news():
    item = news.generate_news_item(market)
    # News now affects stock prices
    if item.get('sectors'):
        for s in market.stocks.values():
            if s['sector'] in item['sectors']:
                impact = item['sentiment'] * 0.015
                s['price'] *= (1 + impact)
                s['price'] = round(max(0.5, s['price']), 2)
    return jsonify(item)

@app.route('/api/events/random')
def random_event():
    return jsonify(events.generate_random_event())

@app.route('/api/blackswan')
def get_blackswan():
    return jsonify(blackswan.trigger(market))

# --- Stock generation ---
@app.route('/api/generate-stock', methods=['POST'])
def generate_stock():
    data = request.json or {}
    use_ai = data.get('use_ai', False)
    count = data.get('count', 1)
    new_stocks = []
    for _ in range(count):
        stock = _generate_via_ollama() if use_ai else generate_fallback_stock()
        if not stock: stock = generate_fallback_stock()
        market.add_stock(stock)
        new_stocks.append(stock)
    return jsonify(new_stocks)

def _generate_via_ollama():
    try:
        import requests
        prompt = """Generate a fictional public company JSON with keys:
ticker (4-letter uppercase), name, sector (Tech/Finance/Healthcare/Biotech/Military/Energy/Pharma/Retail/Crypto/Real Estate),
base_price (10-500), volatility (0.01-0.08), description.
Return ONLY JSON."""
        r = requests.post(OLLAMA_URL, json={'model': OLLAMA_MODEL, 'prompt': prompt, 'stream': False, 'format': 'json'}, timeout=10)
        d = json.loads(r.json()['response'])
        return {
            'ticker': d['ticker'].upper(), 'name': d['name'], 'sector': d['sector'],
            'price': float(d['base_price']), 'base_price': float(d['base_price']),
            'volatility': float(d['volatility']), 'description': d.get('description', ''),
            'risk': 'High' if float(d['volatility'])>0.05 else 'Medium' if float(d['volatility'])>0.025 else 'Low',
            'history': [float(d['base_price'])]*100,
            'volume': random.randint(100000, 50000000),
            'market_cap': float(d['base_price'])*random.randint(1000000, 100000000),
            'pe': round(random.uniform(10,40),2), 'eps': round(random.uniform(0.5,15),2),
            'beta': round(random.uniform(0.5,2),2), 'dividend': round(random.uniform(0,4),2),
            'change': 0, 'change_pct': 0,
        }
    except Exception as e:
        print(f"Ollama: {e}")
        return None

# --- Trading ---
@app.route('/api/trade', methods=['POST'])
def trade():
    data = request.json
    ticker = data['ticker']
    qty = int(data['quantity'])
    action = data['action']
    order_type = data.get('order_type', 'market')
    stock = market.get_stock(ticker)
    if not stock: return jsonify({'error': 'Not found'}), 404
    price = stock['price']
    slippage = 0
    if qty > 1000:
        slippage = price * 0.001 * (qty / 1000)
        price = price + slippage if action == 'buy' else price - slippage
    subtotal = price * qty
    fees = max(1.00, subtotal * 0.0005)
    total = subtotal + fees if action == 'buy' else subtotal - fees
    return jsonify({
        'success': True, 'ticker': ticker, 'action': action, 'quantity': qty,
        'price': round(price, 2), 'slippage': round(slippage, 4),
        'subtotal': round(subtotal, 2), 'fees': round(fees, 2),
        'total': round(total, 2),
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'order_type': order_type,
    })

# --- Loans / Cards ---
@app.route('/api/loan/apply', methods=['POST'])
def loan_apply():
    data = request.json
    amount = float(data['amount']); term_months = int(data['term'])
    credit_score = int(data.get('credit_score', 650))
    if credit_score >= 750: rate = 0.05
    elif credit_score >= 700: rate = 0.07
    elif credit_score >= 650: rate = 0.10
    elif credit_score >= 600: rate = 0.14
    else: rate = 0.20
    approved = credit_score >= 580 and amount <= credit_score * 100
    mr = rate / 12
    mp = (amount * mr) / (1 - (1 + mr) ** -term_months) if mr > 0 else amount / term_months
    return jsonify({
        'approved': approved, 'amount': amount, 'rate': round(rate*100, 2),
        'term': term_months, 'monthly_payment': round(mp, 2),
        'total_payment': round(mp * term_months, 2),
        'denied_reason': None if approved else 'Credit score insufficient or amount exceeds limit.'
    })

@app.route('/api/card/apply', methods=['POST'])
def card_apply():
    data = request.json
    credit_score = int(data.get('credit_score', 650))
    card_type = data.get('type', 'standard')
    tiers = {
        'standard': {'min': 580, 'limit': 2000, 'apr': 24.99},
        'gold': {'min': 680, 'limit': 10000, 'apr': 19.99},
        'platinum': {'min': 740, 'limit': 25000, 'apr': 16.99},
        'black': {'min': 800, 'limit': 100000, 'apr': 13.99},
    }
    tier = tiers.get(card_type, tiers['standard'])
    approved = credit_score >= tier['min']
    return jsonify({
        'approved': approved, 'type': card_type,
        'limit': tier['limit'] if approved else 0, 'apr': tier['apr'],
        'number_masked': f"**** **** **** {random.randint(1000,9999)}",
        'expiry': (datetime.now() + timedelta(days=365*4)).strftime('%m/%y'),
        'cvv_masked': '***',
        'denied_reason': None if approved else f'Minimum {tier["min"]} credit required.'
    })

# ============ OPTIONS ============
@app.route('/api/options/<ticker>')
def get_options_chain(ticker):
    return jsonify(options.get_chain(ticker.upper()))

@app.route('/api/options/trade', methods=['POST'])
def trade_option():
    return jsonify(options.execute_trade(request.json))

# ============ CRYPTO ============
@app.route('/api/crypto')
def get_crypto():
    crypto.tick()
    return jsonify(crypto.get_all())

@app.route('/api/crypto/<symbol>')
def get_crypto_single(symbol):
    return jsonify(crypto.get(symbol.upper()))

@app.route('/api/crypto/stake', methods=['POST'])
def stake_crypto():
    return jsonify(crypto.stake(request.json))

# ============ REAL ESTATE ============
@app.route('/api/realestate')
def get_realestate():
    realestate.tick()
    return jsonify(realestate.get_all())

@app.route('/api/realestate/buy', methods=['POST'])
def buy_property():
    return jsonify(realestate.buy(request.json))

# ============ BONDS ============
@app.route('/api/bonds')
def get_bonds():
    return jsonify(bonds.get_all())

@app.route('/api/bonds/buy', methods=['POST'])
def buy_bond():
    return jsonify(bonds.buy(request.json))

# ============ FOREX ============
@app.route('/api/forex')
def get_forex():
    forex.tick()
    return jsonify(forex.get_all())

@app.route('/api/forex/trade', methods=['POST'])
def trade_forex():
    return jsonify(forex.trade(request.json))

# ============ ETFs / Mutual Funds ============
@app.route('/api/etfs')
def get_etfs():
    return jsonify(etfs.get_all())

# ============ CAREER ============
@app.route('/api/career')
def get_career():
    return jsonify(career.get_jobs())

@app.route('/api/career/promote', methods=['POST'])
def promote():
    return jsonify(career.promote(request.json))

# ============ TAX ============
@app.route('/api/tax/calculate', methods=['POST'])
def calc_tax():
    return jsonify(tax.calculate(request.json))

# ============ EARNINGS ============
@app.route('/api/earnings/calendar')
def earnings_cal():
    return jsonify(earnings.get_calendar())

@app.route('/api/earnings/<ticker>/release', methods=['POST'])
def release_earnings(ticker):
    return jsonify(earnings.release(ticker.upper()))

# ============ SEC FILINGS ============
@app.route('/api/sec/<ticker>')
def get_filings(ticker):
    return jsonify(sec.get_filings(ticker.upper()))

@app.route('/api/sec/insiders/<ticker>')
def get_insiders(ticker):
    return jsonify(sec.get_insider_trades(ticker.upper()))

# ============ LEADERBOARD ============
@app.route('/api/leaderboard', methods=['GET', 'POST'])
def leaderboard_route():
    if request.method == 'POST':
        leaderboard.submit(request.json)
    return jsonify(leaderboard.get_top())

# ============ BOT BACKTESTING ============
@app.route('/api/bot/backtest', methods=['POST'])
def bot_backtest():
    return jsonify(bots.backtest(request.json))

# ============ PORTFOLIO sync ============
@app.route('/api/portfolio', methods=['GET', 'POST'])
def portfolio(): return jsonify({'ok': True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)