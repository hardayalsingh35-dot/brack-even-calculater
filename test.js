/* Quick test harness — run with: node test.js */
const P = require("./calculator.js");

let pass = 0, fail = 0;
function eq(name, actual, expected, tol = 0.011) {
  const ok = Math.abs(actual - expected) <= tol;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}: got ${actual}, expected ${expected}`);
  ok ? pass++ : fail++;
}
function is(name, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  ok ? pass++ : fail++;
}

// 1. Simple gain: buy 1000, sell 1350
let r = P.calculate({ costPrice: 1000, sellPrice: 1350 });
is("1 status", r.status, "profit");
eq("1 profit", r.profit, 350);
eq("1 margin", r.marginPercent, (350 / 1350) * 100);
eq("1 roi", r.roiPercent, 35);
eq("1 break-even", r.breakEvenPrice, 1000);

// 2. Simple loss: buy 1000, sell 800
r = P.calculate({ costPrice: 1000, sellPrice: 800 });
is("2 status", r.status, "loss");
eq("2 profit", r.profit, -200);
eq("2 break-even", r.breakEvenPrice, 1000);

// 3. Exact break-even (null income)
r = P.calculate({ costPrice: 500, sellPrice: 500 });
is("3 status", r.status, "break-even");
eq("3 profit", r.profit, 0);

// 4. Quantity multiplies everything
r = P.calculate({ costPrice: 100, sellPrice: 120, quantity: 10 });
eq("4 total cost", r.totalCost, 1000);
eq("4 gross revenue", r.grossRevenue, 1200);
eq("4 profit", r.profit, 200);
eq("4 profit per unit", r.profitPerUnit, 20);
eq("4 break-even", r.breakEvenPrice, 100);

// 5. Extra cost + flat fee + percentage fee
// cost = 100 + 10 extra = 110/unit * 5 = 550 + 50 flat = 600
// revenue = 150 * 5 = 750, fee 2% = 15, net = 735
// profit = 735 - 600 = 135
r = P.calculate({ costPrice: 100, sellPrice: 150, quantity: 5, extraCost: 10, feePercent: 2, flatFee: 50 });
eq("5 total cost", r.totalCost, 600);
eq("5 fees", r.fees, 15);
eq("5 net revenue", r.netRevenue, 735);
eq("5 profit", r.profit, 135);
// break-even: sell * 5 * 0.98 = 600  => sell = 600 / 4.9 = 122.4489...
eq("5 break-even", r.breakEvenPrice, 600 / (5 * 0.98));

// 6. Break-even with fees really yields ~0 profit
const be = P.calculate({ costPrice: 100, sellPrice: 150, quantity: 5, extraCost: 10, feePercent: 2, flatFee: 50 }).breakEvenPrice;
r = P.calculate({ costPrice: 100, sellPrice: be, quantity: 5, extraCost: 10, feePercent: 2, flatFee: 50 });
is("6 status", r.status, "break-even");
eq("6 profit ~ 0", r.profit, 0, 0.05);

// 7. Validation
r = P.calculate({ costPrice: "abc", sellPrice: 10 });
is("7 ok flag", r.ok, false);
is("7 error count", r.errors.length > 0, true);

r = P.calculate({ costPrice: 10, sellPrice: -5 });
is("8 negative sell rejected", r.ok, false);

r = P.calculate({ costPrice: 10, sellPrice: 12, quantity: 0 });
is("9 zero qty rejected", r.ok, false);

// 10. String inputs (from HTML fields) and default quantity
r = P.calculate({ costPrice: "250", sellPrice: "300.50", quantity: "", feePercent: "1.5" });
eq("10 total cost", r.totalCost, 250);
eq("10 profit", r.profit, 300.5 - 300.5 * 0.015 - 250);

// 11. Float-noise case: 0.1 + 0.2 style
r = P.calculate({ costPrice: 0.1, sellPrice: 0.3, quantity: 3 });
eq("11 profit", r.profit, 0.6);

// 12. Formatting
is("12 INR format", P.formatMoney(1234567.891, "INR"), "₹12,34,567.89");
is("12 USD format", P.formatMoney(1234567.891, "USD"), "$1,234,567.89");
is("12 negative", P.formatMoney(-50, "INR"), "-₹50.00");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
