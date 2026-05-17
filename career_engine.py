JOBS = [
    {'id': 'intern', 'title': 'Intern', 'salary_annual': 35_000, 'level': 1, 'requires': {'trades': 0, 'net_worth': 0}},
    {'id': 'junior', 'title': 'Junior Analyst', 'salary_annual': 65_000, 'level': 2, 'requires': {'trades': 25, 'net_worth': 50_000}},
    {'id': 'analyst', 'title': 'Equity Analyst', 'salary_annual': 95_000, 'level': 3, 'requires': {'trades': 100, 'net_worth': 100_000}},
    {'id': 'senior', 'title': 'Senior Analyst', 'salary_annual': 140_000, 'level': 4, 'requires': {'trades': 250, 'net_worth': 250_000}},
    {'id': 'trader', 'title': 'Trader', 'salary_annual': 220_000, 'level': 5, 'requires': {'trades': 500, 'net_worth': 500_000}},
    {'id': 'pm', 'title': 'Portfolio Manager', 'salary_annual': 380_000, 'level': 6, 'requires': {'trades': 1000, 'net_worth': 1_000_000}},
    {'id': 'mddir', 'title': 'Managing Director', 'salary_annual': 650_000, 'level': 7, 'requires': {'trades': 2000, 'net_worth': 5_000_000}},
    {'id': 'partner', 'title': 'Partner', 'salary_annual': 1_200_000, 'level': 8, 'requires': {'trades': 4000, 'net_worth': 15_000_000}},
    {'id': 'cio', 'title': 'Chief Investment Officer', 'salary_annual': 2_500_000, 'level': 9, 'requires': {'trades': 8000, 'net_worth': 50_000_000}},
    {'id': 'hfm', 'title': 'Hedge Fund Manager', 'salary_annual': 10_000_000, 'level': 10, 'requires': {'trades': 15000, 'net_worth': 100_000_000}},
]

class CareerEngine:
    def get_jobs(self): return JOBS

    def promote(self, data):
        trades = data.get('trades', 0)
        net_worth = data.get('net_worth', 0)
        current = data.get('current', 'intern')
        cur_idx = next((i for i,j in enumerate(JOBS) if j['id'] == current), 0)
        next_job = JOBS[cur_idx + 1] if cur_idx + 1 < len(JOBS) else None
        if not next_job:
            return {'promoted': False, 'reason': 'Max level reached'}
        req = next_job['requires']
        if trades >= req['trades'] and net_worth >= req['net_worth']:
            return {'promoted': True, 'new_job': next_job, 'bonus': next_job['salary_annual'] * 0.10}
        return {
            'promoted': False,
            'reason': f"Need {req['trades']-trades} more trades and ${max(0,req['net_worth']-net_worth):,.0f} more net worth"
        }