/*
 * Profit / Loss / Break-even calculator
 * -------------------------------------
 * Pure calculation core. No DOM, no dependencies — works in a browser AND in Node
 * (so it can be unit-tested). The UI lives in index.html and calls these functions.
 *
 * Money maths note: values are handled as numbers. Round only at display time
 * (formatMoney) so intermediate results don't drift.
 */

(function (global) {
  "use strict";

  /** Round to 2 decimals, avoiding float noise like 100.00000000000001 */
  function round2(n) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }

  /** Safe number parse: "", null, undefined, "abc" -> NaN */
  function toNum(v) {
    if (typeof v === "number") return v;
    if (v === null || v === undefined) return NaN;
    var s = String(v).trim().replace(/[^0-9eE\.\+-]/g, "");
    if (s === "" || s === "-" || s === "+" || s === ".") return NaN;
    var n = Number(s);
    return isFinite(n) ? n : NaN;
  }

  /**
   * Main calculation.
   *
   * @param {Object} input
   * @param {number} input.costPrice     Cost of ONE unit (buy price)
   * @param {number} input.sellPrice     Sell price of ONE unit
   * @param {number} [input.quantity=1]  Number of units
   * @param {number} [input.extraCost=0]  Extra cost per unit (shipping, tax, fees, packaging...)
   * @param {number} [input.feePercent=0] Selling fee as a % of revenue (platform / payment / broker fee)
   * @param {number} [input.flatFee=0]   Flat fee for the whole deal
   * @returns {Object} result — see fields below
   */
  function calculate(input) {
    var i = input || {};

    var costPrice = toNum(i.costPrice);
    var sellPrice = toNum(i.sellPrice);
    var quantity = toNum(i.quantity);
    var extraCost = toNum(i.extraCost);
    var feePercent = toNum(i.feePercent);
    var flatFee = toNum(i.flatFee);

    var errors = [];
    if (!isFinite(costPrice)) errors.push("Enter a valid cost price.");
    else if (costPrice < 0) errors.push("Cost price cannot be negative.");

    if (!isFinite(sellPrice)) errors.push("Enter a valid sell price.");
    else if (sellPrice < 0) errors.push("Sell price cannot be negative.");

    if (!isFinite(quantity)) quantity = 1;          // default to 1 unit
    if (quantity <= 0) errors.push("Quantity must be greater than 0.");

    if (!isFinite(extraCost) || extraCost < 0) extraCost = 0;   // optional
    if (!isFinite(flatFee) || flatFee < 0) flatFee = 0;         // optional
    if (!isFinite(feePercent)) feePercent = 0;                  // optional
    if (feePercent < 0 || feePercent >= 100) errors.push("Fee % must be between 0 and 100.");

    if (errors.length) {
      return { ok: false, errors: errors };
    }

    var totalCostPerUnit = costPrice + extraCost;
    var totalCost = totalCostPerUnit * quantity + flatFee;
    var grossRevenue = sellPrice * quantity;
    var fees = grossRevenue * (feePercent / 100);
    var netRevenue = grossRevenue - fees;

    // profit > 0 = gain, profit < 0 = loss, profit === 0 = break-even ("null income")
    var profit = netRevenue - totalCost;

    // Margin = profit / revenue (how much of each rupee sold you keep)
    // ROI    = profit / cost    (return on the money you put in)
    var marginPercent = netRevenue !== 0 ? (profit / netRevenue) * 100 : (profit === 0 ? 0 : Infinity);
    var roiPercent = totalCost !== 0 ? (profit / totalCost) * 100 : (profit === 0 ? 0 : Infinity);

    // Break-even sell price: the price where profit is exactly 0, after fees.
    //   sell * qty * (1 - fee/100) = cost*qty + extra*qty + flatFee
    var breakEvenPrice =
      netRevenue !== 0
        ? totalCost / (quantity * (1 - feePercent / 100))
        : totalCost / quantity;

    var status;
    var epsilon = 0.005; // half a paisa/cent — treat tiny floats as break-even
    if (Math.abs(profit) < epsilon) status = "break-even";
    else if (profit > 0) status = "profit";
    else status = "loss";

    return {
      ok: true,
      errors: [],
      status: status,                 // "profit" | "loss" | "break-even"
      quantity: quantity,
      totalCost: round2(totalCost),
      grossRevenue: round2(grossRevenue),
      fees: round2(fees),
      netRevenue: round2(netRevenue),
      profit: round2(profit),         // signed: + gain, - loss
      profitAbs: round2(Math.abs(profit)),
      marginPercent: round2(marginPercent),
      roiPercent: round2(roiPercent),
      breakEvenPrice: round2(breakEvenPrice),
      profitPerUnit: round2(profit / quantity)
    };
  }

  /** Locale-aware money string, e.g. ₹1,250.00 */
  function formatMoney(n, currency) {
    var cur = currency || "INR";
    var symbols = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
    var sym = symbols[cur] !== undefined ? symbols[cur] : cur + " ";
    var val = toNum(n);
    if (!isFinite(val)) return sym + "0.00";
    var sign = val < 0 ? "-" : "";
    var abs = Math.abs(val);
    // Use Indian grouping for INR, western grouping otherwise
    var grouped =
      cur === "INR"
        ? abs.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return sign + sym + grouped;
  }

  var api = { calculate: calculate, formatMoney: formatMoney, round2: round2, toNum: toNum };

  // Export for both environments
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.ProfitCalc = api;
})(typeof window !== "undefined" ? window : globalThis);
