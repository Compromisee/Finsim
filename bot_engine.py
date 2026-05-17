import random

class BotEngine:
    def __init__(self, market):
        self.market = market

    def backtest(self, data):
        ticker = data['ticker']
        rules = data['rules']  # list of {if, op, value, then, qty}
        days = int(data.get('days', 90))
        s = self.market.get_stock(ticker)
        if not s: return {'error': 'Not found'}
        history = s['history'][-days:] if len(s['history']) >= days else s['history']

        cash = 100000.0
        shares = 0
        trades = []
        for i in range(20, len(history)):
            price = history[i]
            prev = history[i-1]
            sma20 = sum(history[i-20:i])/20
            sma50 = sum(history[max(0,i-50):i])/min(50, i) if i >= 5 else price
            rsi = self._rsi(history[max(0,i-14):i])
            change_pct = (price-prev)/prev*100

            ctx = {
                'price': price, 'sma20': sma20, 'sma50': sma50,
                'rsi': rsi, 'change_pct': change_pct
            }

            for rule in rules:
                metric = ctx.get(rule['if'], 0)
                op = rule['op']; val = float(rule['value'])
                triggered = (op=='>' and metric>val) or (op=='<' and metric<val) or (op=='==' and abs(metric-val)<0.01)
                if not triggered: continue
                act = rule['then']; qty = int(rule.get('qty', 10))
                if act == 'buy' and cash >= price * qty:
                    cash -= price * qty
                    shares += qty
                    trades.append({'day': i, 'action': 'BUY', 'price': round(price,2), 'qty': qty})
                elif act == 'sell' and shares >= qty:
                    cash += price * qty
                    shares -= qty
                    trades.append({'day': i, 'action': 'SELL', 'price': round(price,2), 'qty': qty})

        final_value = cash + shares * history[-1]
        return {
            'starting_cash': 100000, 'final_value': round(final_value, 2),
            'return_pct': round((final_value-100000)/1000, 2),
            'trades': trades[:50], 'total_trades': len(trades),
            'ending_shares': shares, 'ending_cash': round(cash, 2),
        }

    def _rsi(self, prices):
        if len(prices) < 2: return 50
        gains = sum(max(0, prices[i]-prices[i-1]) for i in range(1, len(prices)))
        losses = sum(max(0, prices[i-1]-prices[i]) for i in range(1, len(prices)))
        if losses == 0: return 100
        rs = gains / losses
        return 100 - (100 / (1 + rs))