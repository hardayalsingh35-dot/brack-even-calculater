# Profit / Loss / Break-even Calculator

A zero-dependency JavaScript calculator that answers three questions at once:
**how much did I gain, how much did I lose, and at what price do I break even
("null income" = zero profit)?**

## Files

| File | What it is |
|---|---|
| `index.html` | The UI. Open it in any browser — no build step, no internet needed. |
| `calculator.js` | The calculation core. Works in the browser *and* in Node. |
| `test.js` | 32 unit tests for the core. |

## Run it

```bash
# Option A — just double-click index.html

# Option B — serve it locally
python3 -m http.server 8000
# then visit http://localhost:8000

# Run the tests
node test.js
```

## Inputs

| Field | Meaning |
|---|---|
| Cost price | What you paid for **one** unit |
| Sell price | What you sell **one** unit for |
| Quantity | Number of units (defaults to 1) |
| Extra cost per unit | Shipping, tax, packaging, commission — anything per unit |
| Selling fee (%) | Platform / payment / broker fee as a % of revenue |
| Flat fee | One fixed fee for the whole deal |
| Currency | INR / USD / EUR / GBP — changes the symbol and digit grouping |

## Outputs

- **Profit** — signed. Positive = gain, negative = loss, zero = break-even.
- **Total cost** = (cost + extra) × quantity + flat fee
- **Gross revenue** = sell × quantity
- **Fees** = gross revenue × fee%
- **Net revenue** = gross revenue − fees
- **Profit margin** = profit ÷ net revenue × 100
- **ROI** = profit ÷ total cost × 100
- **Profit per unit**
- **Break-even sell price** — the exact price where profit becomes 0, *after* fees:

  ```
  breakEven = totalCost / (quantity × (1 − fee% / 100))
  ```

## Using the core in your own code

```js
const P = require("./calculator.js");

const r = P.calculate({
  costPrice: 100,
  sellPrice: 150,
  quantity: 5,
  extraCost: 10,
  feePercent: 2,
  flatFee: 50
});

// r.status          -> "profit" | "loss" | "break-even"
// r.profit          -> 135
// r.breakEvenPrice  -> 122.45   (sell at this and you make exactly 0)
// r.ok              -> true
console.log(P.formatMoney(r.profit, "INR")); // "₹135.00"
```

Invalid input never throws — it returns `{ ok: false, errors: [...] }`
(negative prices, zero/negative quantity, fee % outside 0–100, non-numeric text).
