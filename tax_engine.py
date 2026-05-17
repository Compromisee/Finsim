class TaxEngine:
    def calculate(self, data):
        st_gains = float(data.get('short_term_gains', 0))
        lt_gains = float(data.get('long_term_gains', 0))
        income = float(data.get('income', 0))
        deductions = float(data.get('deductions', 13850))

        ord_income = income + st_gains - deductions
        ord_tax = self._brackets(ord_income, [
            (11600, 0.10), (47150, 0.12), (100525, 0.22),
            (191950, 0.24), (243725, 0.32), (609350, 0.35), (float('inf'), 0.37)
        ])
        lt_tax = self._brackets(lt_gains, [
            (47025, 0.0), (518900, 0.15), (float('inf'), 0.20)
        ])
        total = ord_tax + lt_tax
        return {
            'short_term_gains': st_gains, 'long_term_gains': lt_gains,
            'income': income, 'deductions': deductions,
            'taxable_ordinary': max(0, ord_income),
            'ordinary_tax': round(ord_tax, 2),
            'long_term_tax': round(lt_tax, 2),
            'total_tax': round(total, 2),
            'effective_rate': round(total/(income+st_gains+lt_gains+0.001)*100, 2),
        }

    def _brackets(self, amount, brackets):
        if amount <= 0: return 0
        tax = 0; prev = 0
        for cap, rate in brackets:
            if amount <= cap:
                tax += (amount - prev) * rate
                return tax
            tax += (cap - prev) * rate
            prev = cap
        return tax