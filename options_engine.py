import math, random
from datetime import datetime, timedelta

class OptionsEngine:
    def __init__(self, market):
        self.market = market

    def get_chain(self, ticker):
        s = self.market.get_stock(ticker)
        if not s: return {'error': 'Not found'}
        price = s['price']
        vol = s['volatility']
        chains = []
        expiries = [7, 14, 30, 60, 90]
        for days in expiries:
            for offset_pct in [-0.15, -0.10, -0.05, 0, 0.05, 0.10, 0.15]:
                strike = round(price * (1 + offset_pct), 2)
                call_p = self._bs(price, strike, days/365, vol, 'call')
                put_p = self._bs(price, strike, days/365, vol, 'put')
                chains.append({
                    'strike': strike,
                    'expiry_days': days,
                    'call_premium': round(call_p, 2),
                    'put_premium': round(put_p, 2),
                    'call_delta': round(self._delta(price, strike, days/365, vol, 'call'), 3),
                    'put_delta': round(self._delta(price, strike, days/365, vol, 'put'), 3),
                    'call_oi': random.randint(50, 50000),
                    'put_oi': random.randint(50, 50000),
                    'iv': round(vol * 100 * (1 + abs(offset_pct)), 2),
                })
        return {'ticker': ticker, 'price': price, 'chain': chains, 'expiries': expiries}

    def _bs(self, S, K, T, sigma, kind):
        if T <= 0: return max(0, S - K) if kind == 'call' else max(0, K - S)
        r = 0.045
        d1 = (math.log(S/K) + (r + sigma**2/2)*T) / (sigma*math.sqrt(T))
        d2 = d1 - sigma*math.sqrt(T)
        N = lambda x: 0.5 * (1 + math.erf(x/math.sqrt(2)))
        if kind == 'call':
            return S*N(d1) - K*math.exp(-r*T)*N(d2)
        return K*math.exp(-r*T)*N(-d2) - S*N(-d1)

    def _delta(self, S, K, T, sigma, kind):
        if T <= 0: return 1.0 if (kind=='call' and S>K) else 0.0
        r = 0.045
        d1 = (math.log(S/K) + (r + sigma**2/2)*T) / (sigma*math.sqrt(T))
        N = lambda x: 0.5 * (1 + math.erf(x/math.sqrt(2)))
        return N(d1) if kind == 'call' else N(d1) - 1

    def execute_trade(self, data):
        ticker = data['ticker']; kind = data['kind']  # call/put
        strike = float(data['strike']); expiry_days = int(data['expiry_days'])
        qty = int(data['quantity'])  # number of contracts (100 shares each)
        action = data['action']  # buy/sell (write)
        s = self.market.get_stock(ticker)
        if not s: return {'error': 'Not found'}
        prem = self._bs(s['price'], strike, expiry_days/365, s['volatility'], kind)
        cost = prem * qty * 100
        fees = max(0.65 * qty, 1.0)
        total = cost + fees if action == 'buy' else cost - fees
        return {
            'success': True, 'ticker': ticker, 'kind': kind, 'strike': strike,
            'expiry_days': expiry_days, 'quantity': qty, 'action': action,
            'premium': round(prem, 2), 'fees': round(fees, 2),
            'total': round(total, 2),
            'expiry': (datetime.utcnow() + timedelta(days=expiry_days)).isoformat() + 'Z',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
        }