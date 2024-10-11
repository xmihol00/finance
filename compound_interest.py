import numpy as np
import matplotlib.pyplot as plt

def overall_to_yearly_performance(overall_performance, years):
    return np.exp(np.log(overall_performance) / years) - 1

fonds = {
    "S&P 500": {
        "performance": 233.5,    # performance od the fond in percentages
        "performance years": 10, # years it too to achieve the performance above
        "principal": 1000,       # initial investment (principal value)
        "initial fee": 0.0,      # initial fee payed from the principal value in percentages
        "time in market": 20,    # years the investment will be in the market
        "dividend yield": 1.8,   # average yearly dividend yield in percentages
        "management fee": 0.03   # average yearly management fee in percentages
    },
    "Gold": {
        "performance": 132.5,
        "performance years": 10,
        "principal": 1000,
        "initial fee": 3.5,
        "time in market": 20,
        "dividend yield": 0.0,
        "management fee": 0.0
    },
    "Some fund": {
        "performance": 300,
        "performance years": 10,
        "principal": 1000,
        "initial fee": 2.5,
        "time in market": 20,
        "dividend yield": 1.2,
        "management fee": 1.5
    }
}

markers = ["o", "s", "D", "P", "X", "v"]
plt.figure(figsize=(14, 9))

for ((key, value), marker) in zip(fonds.items(), markers):
    performance = value["performance"] / 100 + 1
    performance_years = value["performance years"]
    principal = value["principal"]
    initial_fee = value["initial fee"] / 100
    time_in_market = value["time in market"]
    dividend_yield = value["dividend yield"] / 100
    management_fee = value["management fee"] / 100
    yearly_performance = overall_to_yearly_performance(performance, performance_years)
    years = np.arange(0, time_in_market + 1)
    compound_interest = (principal - principal * initial_fee) * (1 + yearly_performance + dividend_yield - management_fee) ** years
    plt.plot(years, compound_interest, label=key, marker=marker)

plt.xlabel("Years")
plt.ylabel("Value")
plt.xticks(np.arange(0, time_in_market + 1, 1))
plt.yticks(np.arange(0, 20000, 1000))
plt.title("Comparison of Expected Performances")
plt.grid(True)
plt.legend()
plt.tight_layout()
plt.show()
