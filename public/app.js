// Minto frontend — renders from real backend data (see api.js) instead of
// localStorage/seed data. All render functions operate on the `state` object
// loaded from GET /api/bootstrap and kept in sync after every mutation.

let state = { user: null, transactions: [], accounts: [], budget: null, goals: [], sharedGroups: [], notificationSettings: {}, integrations: {} };
let type = "EXPENSE";

const icons = { Food: "🍔", Travel: "🚕", Shopping: "🛍️", Subscriptions: "📱", Groceries: "🛒", Rent: "🏠", Bills: "💡", Entertainment: "🎟️", Health: "❤️", Education: "📚", Others: "💳" };

// ---------------------------------------------------------------------------
// Icons (same visual set as the original prototype)
// ---------------------------------------------------------------------------
function svgWrap(body, bg) { return `<span class="merchant-logo" style="background:${bg || "transparent"}">${body}</span>`; }
const BRAND_MARKS = { netflix: "<svg viewBox=\"0 0 32 32\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#111\"/><path d=\"M8 5h4l8 16V5h4v22h-4l-8-16v16H8z\" fill=\"#E50914\"/></svg>", spotify: "<svg viewBox=\"0 0 496 512\"><path fill=\"#1DB954\" d=\"M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z\"/></svg>", amazon: "<svg viewBox=\"0 0 448 512\"><path fill=\"#111\" d=\"M257.2 162.7c-48.7 1.8-169.5 15.5-169.5 117.5 0 109.5 138.3 114 183.5 43.2 6.5 10.2 35.4 37.5 45.3 46.8l56.8-56S341 288.9 341 261.4V114.3C341 89 316.5 32 228.7 32 140.7 32 94 87 94 136.3l73.5 6.8c16.3-49.5 54.2-49.5 54.2-49.5 40.7-.1 35.5 29.8 35.5 69.1zm0 86.8c0 80-84.2 68-84.2 17.2 0-47.2 50.5-56.7 84.2-57.8v40.6zm136 163.5c-7.7 10-70 67-174.5 67S34.2 408.5 9.7 379c-6.8-7.7 1-11.3 5.5-8.3C88.5 415.2 203 488.5 387.7 401c7.5-3.7 13.3 2 5.5 12zm39.8 2.2c-6.5 15.8-16 26.8-21.2 31-5.5 4.5-9.5 2.7-6.5-3.8s19.3-46.5 12.7-55c-6.5-8.3-37-4.3-48-3.2-10.8 1-13 2-14-.3-2.3-5.7 21.7-15.5 37.5-17.5 15.7-1.8 41-.8 46 5.7 3.7 5.1 0 27.1-6.5 43.1z\"/><path fill=\"none\" stroke=\"#FF9900\" stroke-width=\"14\" stroke-linecap=\"round\" d=\"M45 401c100 74 232 69 345 8\"/></svg>", uber: "<svg viewBox=\"0 0 448 512\"><path fill=\"#111\" d=\"M414.1 32H33.9C15.2 32 0 47.2 0 65.9V446c0 18.8 15.2 34 33.9 34H414c18.7 0 33.9-15.2 33.9-33.9V65.9C448 47.2 432.8 32 414.1 32zM237.6 391.1C163 398.6 96.4 344.2 88.9 269.6h94.4V290c0 3.7 3 6.8 6.8 6.8H258c3.7 0 6.8-3 6.8-6.8v-67.9c0-3.7-3-6.8-6.8-6.8h-67.9c-3.7 0-6.8 3-6.8 6.8v20.4H88.9c7-69.4 65.4-122.2 135.1-122.2 69.7 0 128.1 52.8 135.1 122.2 7.5 74.5-46.9 141.1-121.5 148.6z\"/></svg>", swiggy: "<svg viewBox=\"0 0 32 32\"><rect width=\"32\" height=\"32\" rx=\"9\" fill=\"#FF6B00\"/><path d=\"M10 22c5.7-1.5 9.1-4.1 9.1-7.2 0-2.2-1.8-3.7-4.4-3.7-1.8 0-3.6.7-4.8 1.8\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path d=\"M10 22c3.7 1.4 8.4.8 11.2-2.1\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.5\" stroke-linecap=\"round\"/></svg>", zomato: "<svg viewBox=\"0 0 32 32\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#E23744\"/><text x=\"16\" y=\"21\" text-anchor=\"middle\" font-size=\"17\" font-weight=\"900\" font-family=\"Arial\" fill=\"#fff\">z</text></svg>", blinkit: "<svg viewBox=\"0 0 32 32\"><circle cx=\"16\" cy=\"16\" r=\"15\" fill=\"#F7D83E\"/><path d=\"M9 11h10l-7 5h10l-8 6\" fill=\"none\" stroke=\"#111\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>", flipkart: "<svg viewBox=\"0 0 32 32\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#2874F0\"/><path d=\"M9 11h14l-1.5 13h-11zM12 11a4 4 0 0 1 8 0\" fill=\"none\" stroke=\"#FFD500\" stroke-width=\"2\"/></svg>", makemytrip: "<svg viewBox=\"0 0 32 32\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#E43D30\"/><path d=\"M8 22V10l8 7 8-7v12\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2.4\" stroke-linejoin=\"round\"/></svg>", starbucks: "<svg viewBox=\"0 0 32 32\"><circle cx=\"16\" cy=\"16\" r=\"14\" fill=\"#00704A\"/><circle cx=\"16\" cy=\"16\" r=\"7\" fill=\"#fff\"/><path d=\"M12 15c2-3 6-3 8 0M13 20c2 1 4 1 6 0\" fill=\"none\" stroke=\"#00704A\" stroke-width=\"1.5\" stroke-linecap=\"round\"/></svg>", bookmyshow: "<svg viewBox=\"0 0 32 32\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#F84464\"/><path d=\"M9 10h14v12H9zM12 10v12M20 10v12\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2\"/><path d=\"M14 14l5 2-5 2z\" fill=\"#fff\"/></svg>" };
function brandIcon(name) {
  const n = String(name || "").toLowerCase().trim();
  const hit = Object.keys(BRAND_MARKS).find((k) => n.includes(k));
  return hit ? `<span class="merchant-logo brand-mark">${BRAND_MARKS[hit]}</span>` : null;
}
const BANK_MARKS = { hdfc: "<svg viewBox=\"0 0 32 32\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#004C8F\"/><path d=\"M7 9h7v5h4V9h7v14h-7v-5h-4v5H7z\" fill=\"#fff\"/></svg>", icici: "<svg viewBox=\"0 0 32 32\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#F58220\"/><path d=\"M8 10h16v4H8zM8 18h16v4H8z\" fill=\"#fff\"/><path d=\"M10 8v16M22 8v16\" stroke=\"#B31B1B\" stroke-width=\"2\"/></svg>", axis: "<svg viewBox=\"0 0 32 32\"><rect width=\"32\" height=\"32\" rx=\"8\" fill=\"#97144D\"/><path d=\"M7 23 16 7l9 16h-5l-4-8-4 8z\" fill=\"#fff\"/><path d=\"M12 18h8\" stroke=\"#97144D\" stroke-width=\"2\"/></svg>" };
function bankIcon(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("hdfc")) return `<span class="merchant-logo brand-mark">${BANK_MARKS.hdfc}</span>`;
  if (n.includes("icici")) return `<span class="merchant-logo brand-mark">${BANK_MARKS.icici}</span>`;
  if (n.includes("axis")) return `<span class="merchant-logo brand-mark">${BANK_MARKS.axis}</span>`;
  return categoryIcon("Others");
}
function categoryIcon(category) {
  const c = String(category || "").toLowerCase();
  if (c.includes("food")) return svgWrap(`<svg viewBox="0 0 32 32"><path d="M10 7v8M13 7v8M16 7v8M13 15v10M22 7v18M22 7c4 3 4 8 0 10" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round"/></svg>`, "#FFF3EA");
  if (c.includes("travel")) return svgWrap(`<svg viewBox="0 0 32 32"><path d="M6 18l20-7c2-.7 3 1.5 1.1 2.5L17 19l-2 7-2-1 0-5-6 1z" fill="none" stroke="#2563EB" stroke-width="2" stroke-linejoin="round"/></svg>`, "#EFF6FF");
  if (c.includes("shopping")) return svgWrap(`<svg viewBox="0 0 32 32"><path d="M9 11h14l-1 15H10zM12 11a4 4 0 0 1 8 0" fill="none" stroke="#DB2777" stroke-width="2" stroke-linejoin="round"/></svg>`, "#FDF2F8");
  if (c.includes("subscription")) return svgWrap(`<svg viewBox="0 0 32 32"><rect x="8" y="6" width="16" height="20" rx="3" fill="none" stroke="#7C3AED" stroke-width="2"/><path d="M12 11h8M12 16h8M12 21h5" stroke="#7C3AED" stroke-width="2" stroke-linecap="round"/></svg>`, "#F5F3FF");
  if (c.includes("grocery")) return svgWrap(`<svg viewBox="0 0 32 32"><path d="M8 10h16l-2 15H10zM12 10a4 4 0 0 1 8 0" fill="none" stroke="#15803D" stroke-width="2"/></svg>`, "#F0FDF4");
  if (c.includes("rent")) return svgWrap(`<svg viewBox="0 0 32 32"><path d="M6 15l10-8 10 8v11H6zM12 26v-7h8v7" fill="none" stroke="#0F766E" stroke-width="2" stroke-linejoin="round"/></svg>`, "#F0FDFA");
  if (c.includes("bill")) return svgWrap(`<svg viewBox="0 0 32 32"><path d="M10 5h12v22l-3-2-3 2-3-2-3 2z" fill="none" stroke="#B7791F" stroke-width="2"/><path d="M13 11h6M13 16h6" stroke="#B7791F" stroke-width="2" stroke-linecap="round"/></svg>`, "#FFFBEB");
  if (c.includes("health")) return svgWrap(`<svg viewBox="0 0 32 32"><path d="M16 26S6 20 6 12a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 8-10 14-10 14z" fill="none" stroke="#E11D48" stroke-width="2"/></svg>`, "#FFF1F2");
  if (c.includes("entertainment")) return svgWrap(`<svg viewBox="0 0 32 32"><path d="M7 11h18v14H7zM12 11l2-4M20 11l-2-4" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round"/><path d="M14 15l6 3-6 3z" fill="#4F46E5"/></svg>`, "#EEF2FF");
  if (c.includes("education")) return svgWrap(`<svg viewBox="0 0 32 32"><path d="M4 12l12-5 12 5-12 5z" fill="none" stroke="#0891B2" stroke-width="2" stroke-linejoin="round"/><path d="M9 15v6c0 1.5 3 3 7 3s7-1.5 7-3v-6" fill="none" stroke="#0891B2" stroke-width="2"/></svg>`, "#ECFEFF");
  return svgWrap(`<svg viewBox="0 0 32 32"><rect x="6" y="9" width="20" height="14" rx="3" fill="none" stroke="#475569" stroke-width="2"/><path d="M6 14h20" stroke="#475569" stroke-width="2"/></svg>`, "#F1F5F9");
}

// ---------------------------------------------------------------------------
// Formatting + date helpers (real current date, not a hardcoded demo date)
// ---------------------------------------------------------------------------
function money(n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); }
function toDate(v) { return new Date((v || todayKey()) + "T00:00:00"); }
function todayKey() { return new Date().toISOString().slice(0, 10); }
function monthKey(v) { const d = toDate(v); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
function currentMonthKey() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
function previousMonthKey() { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function formatDate(dateStr) {
  const d = toDate(dateStr);
  if (dateStr === todayKey()) return "Today";
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().slice(0, 10)) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
}

// ---------------------------------------------------------------------------
// Derived data helpers (operate on `state.transactions`, mirroring the
// original prototype's math so behavior stays identical once wired to real data)
// ---------------------------------------------------------------------------
function isExpense(t) { return t.type === "EXPENSE" && Number(t.amount) > 0; }
function isIncome(t) { return t.type === "INCOME" && Number(t.amount) > 0; }
function isTransfer(t) { return t.type === "TRANSFER"; }
function isRefund(t) { return t.type === "REFUND"; }
function monthTransactions() { return state.transactions.filter((t) => monthKey(t.date) === currentMonthKey()); }

function totals() {
  const month = monthTransactions();
  const income = month.filter(isIncome).reduce((a, t) => a + Number(t.amount), 0);
  const expenses = month.filter(isExpense).reduce((a, t) => a + Number(t.amount), 0);
  const refunds = month.filter(isRefund).reduce((a, t) => a + Number(t.amount), 0);
  const spending = Math.max(0, expenses - refunds);
  const budget = Number(state.budget?.total) || 0;
  return { month, income, expenses, refunds, spending, budget, remaining: budget - spending, usage: budget ? spending / budget : 0 };
}

function budgetActuals() {
  const out = {};
  monthTransactions().forEach((t) => { if (isExpense(t)) out[t.category] = (out[t.category] || 0) + Number(t.amount); });
  return out;
}
function budgetStatus(category) {
  const actual = budgetActuals()[category] || 0;
  const limit = Number(state.budget?.categories?.[category] || 0);
  return { actual, limit, pct: limit ? actual / limit : 0, remaining: limit - actual };
}

function accountBalances() {
  const balances = {};
  state.accounts.forEach((a) => (balances[a.name] = 0));
  state.transactions.forEach((t) => {
    const acct = t.account || "Cash";
    if (!(acct in balances)) balances[acct] = 0;
    if (isTransfer(t)) {
      if (t.transferSide === "OUT") balances[acct] -= Number(t.amount);
      else if (t.transferSide === "IN") balances[acct] += Number(t.amount);
      return;
    }
    if (isIncome(t) || isRefund(t)) balances[acct] += Number(t.amount);
    else if (isExpense(t)) balances[acct] -= Number(t.amount);
  });
  return balances;
}
function availableBalance() { return Object.values(accountBalances()).reduce((s, v) => s + v, 0); }

function groupBalance(g) {
  let owedToYou = 0, youOwe = 0;
  g.participants.forEach((p) => {
    const net = Number(p.paid || 0) - Number(p.share || 0);
    if (p.name === "You") youOwe += Math.max(0, -net);
    else owedToYou += Math.max(0, net);
  });
  return { owedToYou, youOwe };
}
function sharedSummary() {
  let owed = 0, youOwe = 0;
  state.sharedGroups.forEach((g) => { const b = groupBalance(g); owed += b.owedToYou; youOwe += b.youOwe; });
  return { groups: state.sharedGroups, owed, youOwe };
}

function monthComparisonText() {
  const cur = monthTransactions().filter(isExpense).reduce((a, t) => a + Number(t.amount), 0);
  const prev = state.transactions.filter((t) => monthKey(t.date) === previousMonthKey() && isExpense(t)).reduce((a, t) => a + Number(t.amount), 0);
  if (!prev) return "No prior month data yet";
  const delta = Math.round((cur / prev - 1) * 100);
  return delta === 0 ? "Same as last month" : `${delta > 0 ? "↑" : "↓"} ${Math.abs(delta)}% ${delta > 0 ? "higher" : "lower"} than last month`;
}

function smartInsights() {
  const out = [];
  const t = totals();
  const cats = budgetActuals();
  const top = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
  if (top) out.push({ icon: categoryIcon(top[0]), title: `${top[0]} is your top category this month`, text: `You've spent ${money(top[1])} on ${top[0]} so far.`, action: "See transactions" });
  if (t.budget && t.spending / t.budget >= 0.8) out.push({ icon: "⚠️", title: "Approaching your monthly budget", text: `You've used ${Math.round((t.spending / t.budget) * 100)}% of your ${money(t.budget)} budget.`, action: "Review budget" });
  const recurring = state.transactions.filter((x) => x.recurring);
  if (recurring.length) out.push({ icon: "↻", title: `${recurring.length} recurring payment${recurring.length > 1 ? "s" : ""} detected`, text: "These repeat every month and are counted in your forecast.", action: "View recurring" });
  return out;
}

function notificationData() {
  const out = [], t = totals(), balances = accountBalances(), shared = sharedSummary();
  const ns = state.notificationSettings;
  if (ns.lowBalance && Object.values(balances).some((b) => b < 500 && b > -Infinity) && Object.keys(balances).length)
    out.push({ type: "warn", icon: "₹", title: "Low account balance", text: "One connected account is below ₹500. Check upcoming payments before spending." });
  if (ns.budgetAlert && t.budget > 0 && t.spending / t.budget >= 0.8)
    out.push({ type: t.spending > t.budget ? "danger" : "warn", icon: "!", title: t.spending > t.budget ? "Budget exceeded" : "Budget alert", text: `You've used ${Math.round((t.spending / t.budget) * 100)}% of your ${money(t.budget)} monthly budget.` });
  const upcoming = state.transactions.filter((x) => x.recurring && toDate(x.date) >= toDate(todayKey()));
  if (ns.recurring && upcoming.length) out.push({ type: "info", icon: "↻", title: `${upcoming.length} recurring payment${upcoming.length > 1 ? "s" : ""} detected`, text: "Review upcoming subscriptions and commitments before month end." });
  if (ns.settlement && shared.owed > 0) out.push({ type: "info", icon: "₹", title: `${money(shared.owed)} is owed to you`, text: "You have unsettled shared expenses waiting for settlement." });
  if (ns.unusual) {
    const e = monthTransactions().filter(isExpense);
    const avg = e.length ? e.reduce((a, x) => a + Number(x.amount), 0) / e.length : 0;
    const u = e.find((x) => Number(x.amount) > Math.max(3000, avg * 3));
    if (u) out.push({ type: "warn", icon: "?", title: "Unusual transaction detected", text: `${u.merchant} for ${money(u.amount)} is significantly larger than your typical transaction.` });
  }
  if (ns.sync) out.push({ type: "info", icon: "✓", title: "Accounts synced", text: "Your connected accounts are up to date." });
  return out;
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
const PAGE_TITLES = { home: null, transactions: "Transactions", add: "Add transaction", insights: "Insights", profile: "Profile" };
function go(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.id === page));
  document.querySelectorAll(".phone-nav button[data-page]").forEach((b) => b.classList.toggle("active", b.dataset.page === page));
  const titleEl = document.getElementById("pageTitle");
  if (page === "home") { setGreeting(); renderHome(); } else titleEl.textContent = PAGE_TITLES[page] || "";
  if (page === "transactions") renderTransactions();
  if (page === "insights") renderInsights();
  if (page === "profile") renderProfile();
  if (page === "add") resetForm();
}
document.querySelectorAll(".phone-nav button[data-page]").forEach((b) => b.addEventListener("click", () => go(b.dataset.page)));

function userInitial() {
  return (state.user?.name || "?").trim()[0]?.toUpperCase() || "?";
}
function syncStatusHtml() {
  const bankOn = state.integrations?.aa?.status === "ACTIVE";
  const gmailOn = state.integrations?.gmail?.status === "CONNECTED";
  if (bankOn && gmailOn) return `<span style="color:#07895f;font-weight:800">● Bank &amp; Gmail connected</span>`;
  if (bankOn) return `<span style="color:#07895f;font-weight:800">● Bank connected</span>`;
  if (gmailOn) return `<span style="color:#07895f;font-weight:800">● Gmail connected</span>`;
  return `<span style="color:#94A3B8;font-weight:800">● Manual tracking</span>`;
}
function setGreeting() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = (state.user?.name || "there").split(" ")[0];
  document.getElementById("pageTitle").textContent = `${greeting}, ${first} 👋`;
  document.getElementById("eyebrow").innerHTML = syncStatusHtml();
  document.getElementById("avatar").textContent = userInitial();
}
function tickClock() {
  document.getElementById("clock").textContent = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------
function updateNotifDot() {
  document.getElementById("notifDot").hidden = notificationData().length === 0;
}
function renderHome() {
  updateNotifDot();
  const t = totals();
  const pct = t.budget ? Math.max(0, Math.min(100, Math.round(t.usage * 100))) : 0;
  document.getElementById("balance").textContent = money(Math.max(0, availableBalance()));
  document.getElementById("monthSpend").textContent = money(t.spending);
  document.getElementById("monthComparison").textContent = monthComparisonText();
  document.getElementById("budgetPct").textContent = pct + "%";
  document.getElementById("budgetSpent").textContent = money(t.spending);
  document.getElementById("budgetTotalLabel").textContent = money(t.budget);
  document.getElementById("budgetSpent2").textContent = money(t.spending) + " spent";
  document.getElementById("budgetTotalLabel2").textContent = money(t.budget) + " budget";
  document.getElementById("budgetBar").style.width = pct + "%";
  const statusChip = document.getElementById("budgetStatusChip");
  statusChip.textContent = pct >= 100 ? "Over budget" : pct >= 80 ? "Getting close" : "On track";
  document.getElementById("budgetRemaining").textContent = t.remaining >= 0
    ? money(t.remaining) + " remaining. " + (pct < 80 ? "You're on track to stay within budget." : "You're getting close to your monthly budget.")
    : money(Math.abs(t.remaining)) + " over budget. Consider trimming non-essential spending.";
  document.getElementById("owed").textContent = money(sharedSummary().owed);

  const cats = {};
  t.month.forEach((x) => { if (isExpense(x)) cats[x.category] = (cats[x.category] || 0) + Number(x.amount); });
  const max = Math.max(...Object.values(cats), 1);
  const catsEl = document.getElementById("categories");
  const catEntries = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5);
  catsEl.innerHTML = catEntries.length ? catEntries.map(([c, v]) =>
    `<div class="cat"><div class="ico">${categoryIcon(c)}</div><div class="cat-name">${escapeHtml(c)}<div class="muted">${money(v)}</div></div><div class="bar"><span style="width:${Math.round((v / max) * 100)}%"></span></div><div class="cat-val">${t.spending ? Math.round((v / t.spending) * 100) : 0}%</div></div>`
  ).join("") : '<div class="muted">No spending recorded this month yet.</div>';
  document.getElementById("viewAllBtn").disabled = catEntries.length === 0;

  const insights = smartInsights();
  if (insights.length) {
    document.getElementById("insightHeadline").textContent = insights[0].title;
    document.getElementById("insightBody").textContent = insights[0].text;
  }

  const recurring = state.transactions.filter((x) => x.recurring && toDate(x.date) >= toDate(todayKey())).slice(0, 3);
  document.getElementById("upcoming").innerHTML = recurring.length
    ? recurring.map((x) => `<div class="txn"><div class="ico">${brandIcon(x.merchant) || categoryIcon(x.category)}</div><div class="txn-info"><b>${escapeHtml(x.merchant)}</b><small>${escapeHtml(x.category)} · Expected ${formatDate(x.date)}</small></div><div class="txn-amt">${money(x.amount)}<br><span class="chip yellow">Expected</span></div></div>`).join("")
    : '<div class="muted">No upcoming recurring payments detected.</div>';

  renderSharedMoney();
  renderGoals();
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------
let txnFilters = { query: "", category: "ALL", account: "ALL", type: "ALL", date: "ALL", dateFrom: "", dateTo: "" };
function filteredTransactions() {
  const q = (txnFilters.query || "").toLowerCase();
  return state.transactions.filter((t) => {
    const text = `${t.merchant} ${t.category} ${t.account} ${t.payment} ${t.notes || ""}`.toLowerCase();
    if (q && !text.includes(q)) return false;
    if (txnFilters.category !== "ALL" && t.category !== txnFilters.category) return false;
    if (txnFilters.account !== "ALL" && t.account !== txnFilters.account) return false;
    if (txnFilters.type !== "ALL" && t.type !== txnFilters.type) return false;
    if (txnFilters.date === "MONTH" && monthKey(t.date) !== currentMonthKey()) return false;
    if (txnFilters.date === "CUSTOM") {
      if (txnFilters.dateFrom && t.date < txnFilters.dateFrom) return false;
      if (txnFilters.dateTo && t.date > txnFilters.dateTo) return false;
    }
    return true;
  });
}
function renderTransactions() {
  const el = document.getElementById("transactionList"); if (!el) return;
  let list = filteredTransactions().sort((a, b) => toDate(b.date) - toDate(a.date));

  const categories = [...new Set(state.transactions.map((t) => t.category))].sort();
  const accounts = [...new Set(state.transactions.map((t) => t.account))].sort();
  const controls = document.getElementById("transactionFilters");
  if (controls) controls.innerHTML = `
    <div class="search-box"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="txnSearch" placeholder="Search merchant, category or note" value="${escapeHtml(txnFilters.query)}"></div>
    <div class="filter-row" style="margin-top:8px">${["ALL", "EXPENSE", "INCOME", "TRANSFER", "REFUND"].map((x) => `<button class="filter-pill ${txnFilters.type === x ? "active" : ""}" onclick="setTxnFilter('type','${x}')">${x === "ALL" ? "All" : x[0] + x.slice(1).toLowerCase()}</button>`).join("")}</div>
    <div class="filter-row" style="margin-top:7px">${categories.map((x) => `<button class="filter-pill ${txnFilters.category === x ? "active" : ""}" onclick="setTxnFilter('category',${JSON.stringify(x)})">${escapeHtml(x)}</button>`).join("")}</div>
    <div class="filter-row" style="margin-top:7px"><button class="filter-pill ${txnFilters.date === "ALL" ? "active" : ""}" onclick="setTxnFilter('date','ALL')">All time</button><button class="filter-pill ${txnFilters.date === "MONTH" ? "active" : ""}" onclick="setTxnFilter('date','MONTH')">This month</button><button class="filter-pill ${txnFilters.date === "CUSTOM" ? "active" : ""}" onclick="openDateRangeFilter()"><svg viewBox="0 0 24 24" style="width:11px;height:11px;vertical-align:-1px;margin-right:3px"><rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>${txnFilters.date === "CUSTOM" ? customRangeLabel() : "Custom range"}</button>${accounts.map((x) => `<button class="filter-pill ${txnFilters.account === x ? "active" : ""}" onclick="setTxnFilter('account',${JSON.stringify(x)})">${escapeHtml(x)}</button>`).join("")}</div>
    <div class="export-row">
      <button class="btn secondary" onclick="openEmailExport()"><svg viewBox="0 0 24 24"><path d="M4 6h16v12H4zM4 6l8 7 8-7"/></svg>Email me a copy</button>
      <button class="btn secondary" onclick="clearTxnFilters()"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/></svg>Clear filters</button>
    </div>`;

  const searchInput = document.getElementById("txnSearch");
  if (searchInput) searchInput.oninput = (e) => { txnFilters.query = e.target.value; renderTransactions(); const x = document.getElementById("txnSearch"); if (x) { x.focus(); x.setSelectionRange(x.value.length, x.value.length); } };

  const grouped = {};
  list.forEach((t) => (grouped[t.date] ??= []).push(t));
  el.innerHTML = list.length ? Object.entries(grouped).map(([date, items]) => `
    <div class="txn-date-label">${formatDate(date)}</div>
    ${items.map((t) => `<div class="txn txn-clickable" onclick="openTransactionDetail('${t.id}')">
      <div class="ico">${brandIcon(t.merchant) || categoryIcon(t.category)}</div>
      <div class="txn-info"><b>${escapeHtml(t.merchant)}</b><small>${escapeHtml(t.category)} · ${escapeHtml(t.payment)} · <span class="chip">${escapeHtml(t.source)}</span>${t.recurring ? ' · <span class="chip green">Recurring</span>' : ""}</small></div>
      <div class="txn-amt">${isIncome(t) || isRefund(t) ? "+" : "−"}${money(t.amount)}</div>
    </div>`).join("")}`).join("")
    : `<div class="empty-state"><div class="big">⌕</div><b>No transactions found</b><div style="margin-top:4px">Try changing your search or filters.</div></div>`;
}
function setTxnFilter(key, value) { txnFilters[key] = value; renderTransactions(); }
function customRangeLabel() {
  const { dateFrom, dateTo } = txnFilters;
  if (dateFrom && dateTo) return `${formatDate(dateFrom)} – ${formatDate(dateTo)}`;
  if (dateFrom) return `From ${formatDate(dateFrom)}`;
  if (dateTo) return `Until ${formatDate(dateTo)}`;
  return "Custom range";
}
function clearTxnFilters() { txnFilters = { query: "", category: "ALL", account: "ALL", type: "ALL", date: "ALL", dateFrom: "", dateTo: "" }; renderTransactions(); }
function openDateRangeFilter() {
  openModal("Filter by date", `
  <div class="formgrid">
    <div class="field"><label>From</label><input id="rangeFrom" type="date" value="${txnFilters.dateFrom || ""}"></div>
    <div class="field"><label>To</label><input id="rangeTo" type="date" value="${txnFilters.dateTo || ""}"></div>
  </div>
  <div class="action-row"><button class="btn secondary" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="applyDateRangeFilter()">Apply</button></div>`);
}
function applyDateRangeFilter() {
  const from = document.getElementById("rangeFrom").value;
  const to = document.getElementById("rangeTo").value;
  if (!from && !to) { toast("Pick at least one date"); return; }
  if (from && to && from > to) { toast("From date must be before to date"); return; }
  txnFilters.date = "CUSTOM";
  txnFilters.dateFrom = from;
  txnFilters.dateTo = to;
  closeModal();
  renderTransactions();
}
function buildTransactionsCsv(fromDate, toDate) {
  let rowsData = filteredTransactions();
  if (fromDate) rowsData = rowsData.filter((t) => t.date >= fromDate);
  if (toDate) rowsData = rowsData.filter((t) => t.date <= toDate);
  const rows = [["Date", "Merchant", "Type", "Category", "Amount", "Account", "Payment", "Source", "Recurring", "Notes"], ...rowsData.map((t) => [t.date, t.merchant, t.type, t.category, t.amount, t.account, t.payment, t.source, t.recurring ? "Yes" : "No", t.notes || ""])];
  return rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
}
function downloadCsv(fromDate, toDate) {
  const blob = new Blob([buildTransactionsCsv(fromDate, toDate)], { type: "text/csv;charset=utf-8" }), url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = "minto-transactions.csv"; a.click(); URL.revokeObjectURL(url);
}
function openEmailExport() {
  openModal("Email me a copy", `
  <div class="muted" style="margin-bottom:10px">We'll send a CSV of your transactions (with any filters you've applied) to this address. Leave the dates blank to include everything.</div>
  <div class="formgrid">
    <div class="field full"><label>Email address</label><input id="exportEmail" type="email" value="${escapeHtml(state.user?.email || "")}"></div>
    <div class="field"><label>From date</label><input id="exportFrom" type="date"></div>
    <div class="field"><label>To date</label><input id="exportTo" type="date"></div>
  </div>
  <div class="action-row"><button class="btn secondary" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="sendEmailExport()">Send</button></div>`);
}
async function sendEmailExport() {
  const email = document.getElementById("exportEmail").value.trim();
  const fromDate = document.getElementById("exportFrom").value;
  const toDate = document.getElementById("exportTo").value;
  if (!email) { toast("Enter an email address"); return; }
  if (fromDate && toDate && fromDate > toDate) { toast("From date must be before to date"); return; }
  try {
    await Api.emailExport(email, buildTransactionsCsv(fromDate, toDate));
    closeModal();
    successToast(`✓ Sent to ${email}`);
  } catch (err) {
    closeModal();
    downloadCsv(fromDate, toDate);
    toast(err.message.includes("not configured") ? "Email isn't set up yet — downloaded the CSV instead" : err.message);
  }
}
function openTransactionDetail(id) {
  const t = state.transactions.find((x) => x.id === id); if (!t) return;
  openModal(t.merchant, `
    <div style="display:flex;align-items:center;gap:11px"><div class="ico" style="width:44px;height:44px">${brandIcon(t.merchant) || categoryIcon(t.category)}</div><div><div class="amount" style="margin-top:0">${isIncome(t) || isRefund(t) ? "+" : "−"}${money(t.amount)}</div><span class="chip">${escapeHtml(t.type)}</span></div></div>
    <div class="detail-grid">
      <div class="detail-item"><span>CATEGORY</span>${escapeHtml(t.category)}</div>
      <div class="detail-item"><span>ACCOUNT</span>${escapeHtml(t.account)}</div>
      <div class="detail-item"><span>PAYMENT</span>${escapeHtml(t.payment)}</div>
      <div class="detail-item"><span>DATE</span>${formatDate(t.date)}</div>
      <div class="detail-item"><span>SOURCE</span>${escapeHtml(t.source)}</div>
      <div class="detail-item"><span>RECURRING</span>${t.recurring ? "Yes" : "No"}</div>
    </div>
    ${t.notes ? `<div class="muted"><b style="color:#0F172A">Notes:</b> ${escapeHtml(t.notes)}</div>` : ""}
    <div class="action-row"><button class="btn secondary" onclick="closeModal()">Close</button><button class="btn secondary danger" onclick="deleteTransaction('${t.id}')">Delete</button></div>`);
}
async function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) return;
  await Api.deleteTransaction(id);
  await refreshState();
  closeModal(); renderTransactions(); renderHome(); toast("Transaction deleted");
}

// ---------------------------------------------------------------------------
// Add transaction
// ---------------------------------------------------------------------------
function setType(btn, newType) {
  type = newType;
  btn.parentElement.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
  document.getElementById("toAccountWrap").style.display = newType === "TRANSFER" ? "block" : "none";
}
function merchantCategoryMap() {
  const map = {};
  [...state.transactions].sort((a, b) => toDate(a.date) - toDate(b.date)).forEach((t) => { map[t.merchant.toLowerCase()] = t.category; });
  return map;
}
function populateMerchantList() {
  const list = document.getElementById("merchantList");
  const names = [...new Set(state.transactions.map((t) => t.merchant))].sort();
  list.innerHTML = names.map((n) => `<option value="${escapeHtml(n)}">`).join("");
}
function onMerchantInput() {
  const merchant = document.getElementById("merchant").value.trim().toLowerCase();
  const category = merchantCategoryMap()[merchant];
  if (category) document.getElementById("category").value = category;
}
function resetForm() {
  const form = document.getElementById("expenseForm");
  if (form) form.reset();
  document.getElementById("date").value = todayKey();
  document.getElementById("toAccountWrap").style.display = "none";
  const tabs = document.querySelector("#add .tabs");
  if (tabs) { tabs.querySelectorAll("button").forEach((b, i) => b.classList.toggle("active", i === 0)); }
  type = "EXPENSE";
  populateMerchantList();
}
document.getElementById("expenseForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    amount: Number(document.getElementById("amount").value),
    merchant: document.getElementById("merchant").value.trim(),
    category: document.getElementById("category").value,
    account: document.getElementById("account").value,
    payment: document.getElementById("payment").value,
    date: document.getElementById("date").value || todayKey(),
    notes: document.getElementById("notes").value.trim(),
    recurring: document.getElementById("makeRecurring").checked,
    type,
  };
  if (type === "TRANSFER") payload.toAccount = document.getElementById("toAccount").value;
  try {
    await Api.createTransaction(payload);
    await refreshState();
    resetForm();
    go("transactions");
    toast("Transaction saved");
  } catch (err) {
    toast(err.message);
  }
});

// ---------------------------------------------------------------------------
// Insights: smart insights, notifications, budget manager, recurring, shared, cash flow, goals
// ---------------------------------------------------------------------------
function renderSmartInsights() {
  const el = document.getElementById("smartInsights"); if (!el) return;
  const list = smartInsights();
  el.innerHTML = list.length ? list.map((x) => `<div class="insight-row"><div class="insight-icon">${x.icon}</div><div class="grow"><b>${escapeHtml(x.title)}</b><p>${escapeHtml(x.text)}</p><button class="insight-action">${escapeHtml(x.action)} →</button></div></div>`).join("") : '<div class="muted">Keep using Minto and smart insights will appear as patterns emerge.</div>';
}
function alertListHtml(list) {
  return list.length
    ? `<div class="alert-list">${list.map((x) => `<div class="alert-item"><div class="alert-icon ${x.type}">${x.icon}</div><div class="grow"><b>${escapeHtml(x.title)}</b><p>${escapeHtml(x.text)}</p></div></div>`).join("")}</div>`
    : '<div class="empty-state"><div class="big">✓</div><b>All clear</b><div style="margin-top:4px">No active alerts right now.</div></div>';
}
function renderNotifications() {
  const el = document.getElementById("notificationsCard"); if (!el) return;
  el.innerHTML = alertListHtml(notificationData());
}
function openNotificationsPopup() {
  openModal("Notifications", `
  ${alertListHtml(notificationData())}
  <div class="action-row"><button class="btn secondary" onclick="closeModal();openNotificationSettings()">Manage alerts</button><button class="btn primary" onclick="closeModal()">Done</button></div>`);
}
function openNotificationSettings() {
  const ns = state.notificationSettings;
  openModal("Notification settings", `
  <div class="muted" style="margin-bottom:10px">Choose which alerts Minto should surface.</div>
  ${[["lowBalance", "Low balance alerts", "Warn when an account falls below ₹500."], ["budgetAlert", "Budget alerts", "Warn when monthly spending reaches 80% of budget."], ["recurring", "Upcoming recurring payments", "Surface upcoming subscriptions and commitments."], ["unusual", "Unusual transactions", "Flag unusually large transactions."], ["settlement", "Settlement reminders", "Remind you about money owed to you."], ["sync", "Account sync status", "Show connection and sync status."]].map((x) => `<div class="alert-item"><div class="grow"><b>${x[1]}</b><p>${x[2]}</p></div><button class="alert-toggle ${ns[x[0]] ? "on" : ""}" onclick="toggleNotificationSetting('${x[0]}',this)"></button></div>`).join("")}
  <div class="action-row"><button class="btn primary" onclick="closeModal();renderNotifications();toast('Preferences saved')">Done</button></div>`);
}
async function toggleNotificationSetting(key, button) {
  state.notificationSettings[key] = !state.notificationSettings[key];
  button.classList.toggle("on", state.notificationSettings[key]);
  await Api.patchNotifications({ [key]: state.notificationSettings[key] });
}

function goalIcon(emoji) {
  const map = {
    "🛟": svgWrap(`<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="9" fill="none" stroke="#2563EB" stroke-width="2"/><circle cx="16" cy="16" r="3" fill="none" stroke="#2563EB" stroke-width="2"/><path d="M16 7v6M16 19v6M7 16h6M19 16h6" stroke="#2563EB" stroke-width="2"/></svg>`, "#EFF6FF"),
    "✈️": categoryIcon("Travel"),
    "🚗": svgWrap(`<svg viewBox="0 0 32 32"><path d="M6 20l2-7a3 3 0 0 1 3-2h10a3 3 0 0 1 3 2l2 7" fill="none" stroke="#DB2777" stroke-width="2" stroke-linejoin="round"/><rect x="5" y="20" width="22" height="5" rx="2" fill="none" stroke="#DB2777" stroke-width="2"/><circle cx="10" cy="25" r="1.6" fill="#DB2777"/><circle cx="22" cy="25" r="1.6" fill="#DB2777"/></svg>`, "#FDF2F8"),
    "🏠": categoryIcon("Rent"),
    "🎓": categoryIcon("Education"),
    "💻": svgWrap(`<svg viewBox="0 0 32 32"><rect x="6" y="8" width="20" height="13" rx="2" fill="none" stroke="#7C3AED" stroke-width="2"/><path d="M3 25h26l-2-4H5z" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linejoin="round"/></svg>`, "#F5F3FF"),
  };
  return map[emoji] || svgWrap(`<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="9" fill="none" stroke="#15803D" stroke-width="2"/><circle cx="16" cy="16" r="5" fill="none" stroke="#15803D" stroke-width="2"/><circle cx="16" cy="16" r="1.6" fill="#15803D"/></svg>`, "#F0FDF4");
}
function renderGoals() {
  const goalsEl = document.getElementById("goalsCard");
  if (goalsEl) goalsEl.innerHTML = state.goals.length ? state.goals.map((g) => {
    const pct = Math.min(100, Math.round((Number(g.saved) / Math.max(1, Number(g.target))) * 100));
    const left = Math.max(0, Number(g.target) - Number(g.saved));
    return `<div class="goal">
      <div class="goal-head"><div class="goal-icon">${goalIcon(g.icon)}</div><div class="grow"><b>${escapeHtml(g.name)}</b><div class="muted">${money(g.saved)} of ${money(g.target)} · ${pct}%</div></div><b>${money(left)}</b></div>
      <div class="goal-progress"><span style="width:${pct}%"></span></div>
      <div class="goal-actions"><button class="btn secondary" onclick="addToGoal('${g.id}')">Add money</button><button class="btn secondary" onclick="editGoal('${g.id}')">Edit</button><button class="btn secondary danger" onclick="deleteGoal('${g.id}')">Delete</button></div>
    </div>`;
  }).join("") : '<div class="muted">No savings goals yet. Add your first goal.</div>';

  const g0 = state.goals[0];
  document.getElementById("goalPct").textContent = g0 ? Math.round((g0.saved / g0.target) * 100) + "%" : "0%";
  document.getElementById("goalPctName").textContent = g0 ? g0.name : "No goals yet";
}
function openGoalManager(id) {
  const g = id ? state.goals.find((x) => x.id === id) : null;
  openModal(g ? "Edit savings goal" : "New savings goal", `
  <div class="formgrid">
   <div class="field full"><label>Goal name</label><input id="goalName" value="${escapeHtml(g?.name || "Emergency Fund")}"></div>
   <div class="field"><label>Target amount</label><input id="goalTarget" type="number" min="1" value="${g?.target || 50000}"></div>
   <div class="field"><label>Already saved</label><input id="goalSaved" type="number" min="0" value="${g?.saved || 0}"></div>
   <div class="field"><label>Target date</label><input id="goalDate" type="date" value="${g?.deadline || ""}"></div>
   <div class="field"><label>Icon</label><select id="goalIcon">
     <option value="🛟"${g?.icon === "🛟" ? " selected" : ""}>🛟 Emergency fund</option>
     <option value="✈️"${g?.icon === "✈️" ? " selected" : ""}>✈️ Travel</option>
     <option value="🚗"${g?.icon === "🚗" ? " selected" : ""}>🚗 Vehicle</option>
     <option value="🏠"${g?.icon === "🏠" ? " selected" : ""}>🏠 Home</option>
     <option value="🎓"${g?.icon === "🎓" ? " selected" : ""}>🎓 Education</option>
     <option value="💻"${g?.icon === "💻" ? " selected" : ""}>💻 Tech</option>
     <option value="🎯"${!g || g?.icon === "🎯" ? " selected" : ""}>🎯 General</option>
   </select></div>
   <div class="full action-row"><button class="btn secondary" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="saveGoal('${id || ""}')">Save goal</button></div>
  </div>`);
}
async function saveGoal(id) {
  const name = document.getElementById("goalName").value.trim();
  const target = Number(document.getElementById("goalTarget").value) || 0;
  const saved = Math.max(0, Number(document.getElementById("goalSaved").value) || 0);
  const deadline = document.getElementById("goalDate").value || null;
  const icon = document.getElementById("goalIcon").value;
  if (!name || target <= 0) { toast("Enter a valid goal and target"); return; }
  if (id) await Api.updateGoal(id, { name, target, saved, deadline, icon });
  else await Api.createGoal({ name, target, saved, deadline, icon });
  await refreshState();
  closeModal(); renderGoals(); renderHome(); toast("Savings goal saved");
}
function addToGoal(id) {
  openModal("Add to savings goal", `<div class="field"><label>Amount</label><input id="goalContribution" type="number" min="1" value="1000"></div><div class="muted" style="margin-top:8px">This updates the goal balance. It does not create a bank transaction.</div><div class="action-row"><button class="btn secondary" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="contributeGoal('${id}')">Add</button></div>`);
}
async function contributeGoal(id) {
  const amount = Number(document.getElementById("goalContribution").value) || 0;
  if (amount <= 0) { toast("Enter a valid amount"); return; }
  await Api.contributeGoal(id, amount);
  await refreshState();
  closeModal(); renderGoals(); toast("Goal updated");
}
function editGoal(id) { openGoalManager(id); }
async function deleteGoal(id) {
  if (!confirm("Delete this savings goal?")) return;
  await Api.deleteGoal(id);
  await refreshState();
  renderGoals(); toast("Goal deleted");
}

// Fixed-order categorical palette (validated for CVD-safe adjacency at
// dataviz-skill/references/palette.md); "Other" uses a neutral gray, not a
// 6th competing hue, per the anti-cycling rule.
const CATEGORY_CHART_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"];
const CATEGORY_CHART_OTHER_COLOR = "#94A3B8";

function renderCategoryChart() {
  const el = document.getElementById("categoryChart");
  if (!el) return;
  const actuals = budgetActuals();
  const entries = Object.entries(actuals).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (!total) {
    el.innerHTML = '<div class="empty-state"><div class="big">◔</div><b>No spending yet</b><div style="margin-top:4px">Add a few transactions to see where your money goes.</div></div>';
    return;
  }
  const top = entries.slice(0, 5);
  const otherTotal = entries.slice(5).reduce((sum, [, v]) => sum + v, 0);
  const segments = top.map(([name, value], i) => ({ name, value, color: CATEGORY_CHART_COLORS[i] }));
  if (otherTotal > 0) segments.push({ name: "Other", value: otherTotal, color: CATEGORY_CHART_OTHER_COLOR });

  const gap = 1.2; // visual gap between segments, in path-length percent
  let cumulative = 0;
  const arcs = segments.map((s) => {
    const pct = (s.value / total) * 100;
    const dash = Math.max(0, pct - gap);
    const circle = `<circle cx="21" cy="21" r="15.9155" pathLength="100" fill="none" stroke="${s.color}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${dash} ${100 - dash}" stroke-dashoffset="${-cumulative}"><title>${escapeHtml(s.name)}: ${money(s.value)} (${Math.round(pct)}%)</title></circle>`;
    cumulative += pct;
    return circle;
  }).join("");

  const legend = segments.map((s) => {
    const pct = Math.round((s.value / total) * 100);
    return `<div class="chart-legend-row"><span class="chart-dot" style="background:${s.color}"></span><span class="grow">${escapeHtml(s.name)}</span><b>${money(s.value)}</b><span class="muted" style="width:34px;text-align:right">${pct}%</span></div>`;
  }).join("");

  el.innerHTML = `
    <div class="donut-wrap">
      <svg viewBox="0 0 42 42" class="donut-chart">${arcs}</svg>
      <div class="donut-center"><b>${money(total)}</b><span class="muted">spent</span></div>
    </div>
    <div class="chart-legend">${legend}</div>`;
}

function renderSharedMoney() {
  const shared = sharedSummary();
  const sharedEl = document.getElementById("sharedMoney");
  if (sharedEl) sharedEl.innerHTML = `
    <div class="grid g2" style="gap:10px;margin-bottom:10px">
      <div style="background:#ECFEF7;padding:13px;border-radius:14px"><div class="muted">Owed to you</div><b style="font-size:var(--fs-2xl);color:#15803D">${money(shared.owed)}</b></div>
      <div style="background:#FFF7ED;padding:13px;border-radius:14px"><div class="muted">You owe</div><b style="font-size:var(--fs-2xl);color:#C2410C">${money(shared.youOwe)}</b></div>
    </div>
    ${shared.groups.length ? shared.groups.map((g) => { const bal = groupBalance(g); return `<div class="txn"><div class="ico">👥</div><div class="txn-info"><b>${escapeHtml(g.name)}</b><small>${formatDate(g.date)} · ${g.participants.length} people</small></div><div class="txn-amt">${bal.owedToYou ? `+${money(bal.owedToYou)}` : `-${money(bal.youOwe)}`}<br>${g.status === "OPEN" ? `<button class="link" onclick="settleGroup('${g.id}')">Settle</button>` : '<span class="chip green">Settled</span>'}</div></div>`; }).join("") : '<div class="muted">No shared expenses yet.</div>'}`;
}

function renderInsights() {
  renderNotifications();
  renderSmartInsights();
  renderCategoryChart();

  const bt = totals();
  const bmEl = document.getElementById("budgetManager");
  if (bmEl && state.budget) {
    const used = bt.spending, total = Number(state.budget.total) || 0, pct = total ? Math.round((used / total) * 100) : 0;
    const rows = Object.entries(state.budget.categories).map(([cat, limit]) => {
      const st = budgetStatus(cat), p = Math.min(100, Math.round(st.pct * 100));
      const cls = st.pct > 1 ? "over" : st.pct >= 0.8 ? "warn" : "";
      const label = st.remaining >= 0 ? `${money(st.remaining)} left` : `${money(Math.abs(st.remaining))} over`;
      return `<div class="budget-row"><div class="budget-head"><div class="ico">${categoryIcon(cat)}</div><div class="grow"><b>${escapeHtml(cat)}</b><div class="muted">${money(st.actual)} of ${money(limit)}</div></div><div class="budget-numbers">${p}%</div></div><div class="budget-progress ${cls}"><span style="width:${p}%"></span></div><div class="muted">${label}</div></div>`;
    }).join("");
    bmEl.innerHTML = `
     <div class="budget-summary">
       <div class="budget-kpi"><span class="muted">Budget</span><b>${money(total)}</b></div>
       <div class="budget-kpi"><span class="muted">Spent</span><b>${money(used)}</b></div>
       <div class="budget-kpi"><span class="muted">Remaining</span><b class="${bt.remaining < 0 ? "negative" : ""}">${money(bt.remaining)}</b></div>
     </div>
     ${pct >= 100 ? `<div class="card over-card" style="box-shadow:none;margin-bottom:10px"><b>Budget exceeded</b><div class="muted">Your total spending is above this month's budget.</div></div>` : pct >= 80 ? `<div class="card alert-card" style="box-shadow:none;margin-bottom:10px"><b>Budget alert</b><div class="muted">You've used ${pct}% of your monthly budget.</div></div>` : ""}
     ${rows}`;
  }

  const recurringItems = state.transactions.filter((x) => x.recurring);
  const recurringEl = document.getElementById("recurring");
  if (recurringEl) recurringEl.innerHTML = recurringItems.length ? recurringItems.map((x) => `<div class="txn"><div class="ico">${brandIcon(x.merchant) || categoryIcon(x.category)}</div><div class="txn-info"><b>${escapeHtml(x.merchant)}</b><small>${money(x.amount)}/month · Next ${formatDate(x.date)}</small></div><span class="chip green">Detected</span></div>`).join("") : '<div class="muted">Mark a transaction as recurring to see it here.</div>';

  const recurringMonthly = recurringItems.reduce((a, x) => a + Number(x.amount), 0);
  document.getElementById("recurringAmount").textContent = money(recurringMonthly);
  document.getElementById("recurringCount").textContent = `${recurringItems.length} detected payment${recurringItems.length === 1 ? "" : "s"}`;

  const now = new Date();
  const day = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyRate = bt.spending / Math.max(1, day);
  const futureRecurring = recurringItems.filter((x) => toDate(x.date) > now).reduce((a, x) => a + Number(x.amount), 0);
  const projected = Math.round(bt.spending + dailyRate * (daysInMonth - day) + futureRecurring);
  document.getElementById("forecastAmount").textContent = money(projected);
  document.getElementById("forecastAmount2").textContent = money(projected);
  document.getElementById("forecastChip").textContent = bt.budget && projected > bt.budget ? "Above budget" : "Within budget";
}
async function settleGroup(id) {
  await Api.settleSharedGroup(id);
  await refreshState();
  renderHome(); toast("Expense marked as settled");
}

// ---------------------------------------------------------------------------
// Profile / accounts / integrations
// ---------------------------------------------------------------------------
function renderProfile() {
  document.getElementById("profileName").textContent = state.user?.name || "—";
  document.getElementById("profileEmail").textContent = state.user?.email || "—";
  document.getElementById("profileAvatar").textContent = userInitial();

  const balances = accountBalances();
  document.getElementById("accounts").innerHTML = state.accounts.map((a) => {
    const bal = balances[a.name] ?? 0;
    const icon = a.provider === "AA" ? bankIcon(a.name) : a.name === "Cash" ? categoryIcon("Others") : bankIcon(a.name);
    return `<div class="card account-card" onclick="openAccount('${escapeHtml(a.name)}')">
      <div class="account"><div class="bankicon">${icon}</div><div class="grow"><b>${escapeHtml(a.name)}</b><div class="muted">${a.type === "CREDIT_CARD" ? "Credit card" : a.type === "CASH" ? "Cash wallet" : "Savings account"}</div></div><span class="chip ${a.provider === "AA" ? "green" : ""}">${a.provider === "AA" ? "Bank-synced" : "Manual"}</span></div>
      <div class="account-balance ${bal < 0 ? "credit" : ""}">${money(bal)}</div>
      <div class="account-meta"><span class="muted"><span class="sync-dot"></span>${a.provider === "AA" ? "Synced via bank" : "Tracked in Minto"}</span><span class="muted">View →</span></div>
    </div>`;
  }).join("");

  renderIntegrationStatus();
}

function openAccount(name) {
  const balances = accountBalances(), balance = balances[name] ?? 0;
  const tx = state.transactions.filter((t) => t.account === name).sort((a, b) => toDate(b.date) - toDate(a.date));
  const isCredit = /credit/i.test(name);
  const inflow = tx.filter((t) => isIncome(t) || isRefund(t)).reduce((a, t) => a + Number(t.amount), 0);
  const outflow = tx.filter(isExpense).reduce((a, t) => a + Number(t.amount), 0);
  openModal(name, `
    <div class="account-detail-hero">
      <div class="muted">${isCredit ? "Current outstanding" : "Available balance"}</div>
      <div style="font-size:var(--fs-hero);font-weight:900;margin-top:5px">${money(Math.abs(balance))}</div>
      <div class="muted" style="margin-top:7px">${isCredit ? "Credit card balance" : "Connected account"}</div>
    </div>
    <div class="detail-grid">
      <div class="detail-item"><span>${isCredit ? "CHARGES" : "OUTFLOW"}</span>${money(outflow)}</div>
      <div class="detail-item"><span>${isCredit ? "PAYMENTS" : "INFLOW"}</span>${money(inflow)}</div>
      <div class="detail-item"><span>TRANSACTIONS</span>${tx.length}</div>
      <div class="detail-item"><span>TYPE</span>${isCredit ? "Credit card" : "Bank account"}</div>
    </div>
    <h3 style="margin:18px 0 7px">Recent activity</h3>
    <div>${tx.slice(0, 7).map((t) => `<div class="txn" style="padding:10px 0"><div class="ico">${brandIcon(t.merchant) || categoryIcon(t.category)}</div><div class="txn-info"><b>${escapeHtml(t.merchant)}</b><small>${formatDate(t.date)} · ${escapeHtml(t.category)}</small></div><div class="txn-amt">${isIncome(t) || isRefund(t) ? "+" : "−"}${money(t.amount)}</div></div>`).join("") || '<div class="muted">No transactions in this account.</div>'}</div>
    <div class="action-row"><button class="btn secondary" onclick="closeModal()">Close</button><button class="btn primary" onclick="closeModal();go('add')">Add transaction</button></div>`);
}

async function renderIntegrationStatus() {
  const gmailChip = document.getElementById("gmailChip"), gmailRow = document.getElementById("gmailActionRow");
  const aaChip = document.getElementById("aaChip"), aaRow = document.getElementById("aaActionRow");
  try {
    const gmail = await Api.gmailStatus();
    if (!gmail.configured) { gmailChip.className = "chip yellow"; gmailChip.textContent = "Not configured"; gmailRow.innerHTML = '<div class="muted" style="font-size:var(--fs-sm)">Set GOOGLE_CLIENT_ID / SECRET in .env to enable.</div>'; }
    else if (gmail.status === "CONNECTED") { gmailChip.className = "chip green"; gmailChip.textContent = "Connected"; gmailRow.innerHTML = `<button class="btn secondary" onclick="gmailSync()">Sync now</button><button class="btn secondary danger" onclick="gmailDisconnect()">Disconnect</button>`; }
    else { gmailChip.className = "chip"; gmailChip.textContent = "Not connected"; gmailRow.innerHTML = `<button class="btn primary" onclick="gmailConnect()">Connect Gmail</button>`; }
  } catch { gmailChip.textContent = "Error"; }

  try {
    const aa = await Api.aaStatus();
    if (aa.status === "ACTIVE") { aaChip.className = "chip green"; aaChip.textContent = `Connected (${aa.provider})`; aaRow.innerHTML = `<button class="btn secondary" onclick="aaSync()">Sync now</button><button class="btn secondary danger" onclick="aaDisconnect()">Disconnect</button>`; }
    else { aaChip.className = "chip"; aaChip.textContent = "Not connected"; aaRow.innerHTML = `<button class="btn primary" onclick="aaConnect()">Connect bank</button>`; }
  } catch { aaChip.textContent = "Error"; }
}
async function gmailConnect() {
  try { const { url } = await Api.gmailConnect(); window.location.href = url; }
  catch (err) { toast(err.message); }
}
async function gmailSync() {
  try { const r = await Api.gmailSync(); await refreshState(); renderProfile(); toast(`Imported ${r.imported} transaction${r.imported === 1 ? "" : "s"} from Gmail`); }
  catch (err) { toast(err.message); }
}
async function gmailDisconnect() { await Api.gmailDisconnect(); renderIntegrationStatus(); toast("Gmail disconnected"); }

async function aaConnect() {
  try {
    const r = await Api.aaConnect();
    if (r.status === "ACTIVE") { await refreshState(); renderProfile(); renderHome(); toast(`Bank connected — imported ${r.imported} transaction${r.imported === 1 ? "" : "s"}`); }
    else if (r.approvalUrl) window.location.href = r.approvalUrl;
  } catch (err) { toast(err.message); }
}
async function aaSync() {
  try { const r = await Api.aaSync(); await refreshState(); renderProfile(); toast(`Synced — imported ${r.imported} new transaction${r.imported === 1 ? "" : "s"}`); }
  catch (err) { toast(err.message); }
}
async function aaDisconnect() { await Api.aaDisconnect(); renderIntegrationStatus(); toast("Bank disconnected"); }

async function logout() { await Api.logout(); window.location.href = "/login.html"; }

// ---------------------------------------------------------------------------
// Receipt scan / split expense (unchanged demo flows, layered on real data)
// ---------------------------------------------------------------------------
function openReceipt() {
  openModal("Scan receipt", `<div style="border:2px dashed #C9D5DB;border-radius:17px;padding:32px;text-align:center"><div style="font-size:43px">🧾</div><h3>Upload a receipt</h3><p class="muted">Minto will extract merchant, amount and category.</p><input type="file" accept="image/*" onchange="receiptChosen(this)"></div>`);
}
function receiptChosen(input) {
  if (!input.files?.length) return;
  document.getElementById("modalBody").innerHTML = `<div class="card" style="background:#F8FAFC;box-shadow:none"><span class="chip purple">AI EXTRACTED</span><h2 style="margin:9px 0 2px">Starbucks</h2><div class="amount">₹540</div><p class="muted">Food · Today · UPI</p><button class="btn primary" onclick="closeModal();go('add');toast('Fill in and save to add this transaction')">Use these details</button></div>`;
}
let splitPeopleList = [];
function openSplit() {
  splitPeopleList = ["Rahul", "Priya"];
  openModal("Split expense", `
  <div class="formgrid">
   <div class="field full"><label>Expense</label><input id="splitName" value="Dinner"></div>
   <div class="field"><label>Total amount</label><input id="splitAmt" value="2400" type="number" min="1"></div>
   <div class="field"><label>Your share</label><input id="yourShare" value="800" type="number" min="0"></div>
   <div class="field full">
     <label>People</label>
     <div style="display:flex;gap:8px">
       <input id="splitPersonInput" placeholder="Add a person's name" onkeydown="if(event.key==='Enter'){event.preventDefault();addSplitPerson()}">
       <button type="button" class="btn secondary" onclick="addSplitPerson()">Add</button>
     </div>
     <div id="splitPeopleChips" class="split-people-chips"></div>
   </div>
   <div class="field full"><label>Split method</label><select id="splitMethod"><option value="equal">Equal split</option><option value="custom">Custom</option></select></div>
   <div class="full card" style="background:#F8FAFC;box-shadow:none" id="splitPreview"></div>
   <div class="full" style="display:flex;justify-content:flex-end;gap:8px"><button class="btn secondary" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="createSplit()">Create split</button></div>
  </div>`);
  renderSplitPeopleChips();
  updateSplitPreview();
  ["splitAmt", "yourShare", "splitMethod"].forEach((id) => document.getElementById(id).addEventListener("input", updateSplitPreview));
}
function addSplitPerson() {
  const input = document.getElementById("splitPersonInput");
  const name = input.value.trim();
  if (!name) return;
  if (splitPeopleList.some((p) => p.toLowerCase() === name.toLowerCase())) { toast("Already added"); input.value = ""; return; }
  splitPeopleList.push(name);
  input.value = "";
  input.focus();
  renderSplitPeopleChips();
  updateSplitPreview();
}
function removeSplitPerson(index) {
  splitPeopleList.splice(index, 1);
  renderSplitPeopleChips();
  updateSplitPreview();
}
function renderSplitPeopleChips() {
  const el = document.getElementById("splitPeopleChips");
  if (!el) return;
  el.innerHTML = splitPeopleList.length
    ? splitPeopleList.map((name, i) => `<span class="split-chip">${escapeHtml(name)}<button type="button" onclick="removeSplitPerson(${i})" aria-label="Remove ${escapeHtml(name)}">×</button></span>`).join("")
    : '<span class="muted" style="font-size:var(--fs-sm)">No one added yet</span>';
}
function updateSplitPreview() {
  const total = Number(document.getElementById("splitAmt")?.value) || 0;
  const people = splitPeopleList;
  const totalPeople = people.length + 1;
  const equal = totalPeople ? total / totalPeople : 0;
  const your = Number(document.getElementById("yourShare")?.value) || 0;
  const each = (total - your) / Math.max(1, people.length);
  const method = document.getElementById("splitMethod")?.value;
  const vals = method === "equal" ? people.map((p) => ({ name: p, share: Math.round(equal) })) : people.map((p) => ({ name: p, share: Math.round(each) }));
  const previewEl = document.getElementById("splitPreview");
  if (!previewEl) return;
  previewEl.innerHTML = people.length
    ? `<b>${money(total)} total</b><div class="muted" style="margin-top:5px">You: ${money(method === "equal" ? equal : your)} · ${vals.map((v) => `${escapeHtml(v.name)}: ${money(v.share)}`).join(" · ")}</div>`
    : `<div class="muted">Add at least one person to see the split.</div>`;
}
async function createSplit() {
  const total = Number(document.getElementById("splitAmt").value) || 0;
  const name = document.getElementById("splitName").value.trim() || "Shared expense";
  const people = splitPeopleList;
  const method = document.getElementById("splitMethod").value;
  if (total <= 0 || !people.length) { toast("Add a valid amount and at least one person"); return; }
  const your = method === "equal" ? Math.round(total / (people.length + 1)) : Number(document.getElementById("yourShare").value) || 0;
  const remainder = total - your;
  const each = Math.floor(remainder / people.length);
  let leftover = remainder - each * people.length;
  const participants = [{ name: "You", share: your, paid: total, settled: true }];
  people.forEach((person) => { const share = each + (leftover > 0 ? 1 : 0); leftover--; participants.push({ name: person, share, paid: 0, settled: false }); });
  await Api.createSharedGroup({ name, date: todayKey(), participants });
  await refreshState();
  closeModal();
  renderHome(); renderProfile();
  successToast("✓ Split created successfully");
}

// ---------------------------------------------------------------------------
// Budget manager
// ---------------------------------------------------------------------------
function openBudgetManager() {
  if (!state.budget) return;
  const cats = Object.keys(state.budget.categories);
  openModal("Edit monthly budget", `
  <div class="field"><label>Total monthly budget</label><input id="budgetTotal" type="number" min="0" value="${state.budget.total}"></div>
  <div class="muted" style="margin:14px 0 8px">Category limits</div>
  <div style="max-height:390px;overflow:auto;padding-right:2px">
  ${cats.map((c) => `<div class="field" style="margin:8px 0"><label>${escapeHtml(c)}</label><input class="budget-input" data-cat="${escapeHtml(c)}" type="number" min="0" value="${Number(state.budget.categories[c] || 0)}"></div>`).join("")}
  </div>
  <div style="display:flex;align-items:center;gap:8px;margin:12px 0"><input id="budgetRollover" type="checkbox" ${state.budget.rollover ? "checked" : ""} style="width:auto"><label for="budgetRollover" style="font-size:var(--fs-base);font-weight:700">Carry unused category budget forward</label></div>
  <div class="action-row"><button class="btn secondary" onclick="closeModal()">Cancel</button><button class="btn primary" onclick="saveBudgetManager()">Save budget</button></div>`);
}
async function saveBudgetManager() {
  const total = Math.max(0, Number(document.getElementById("budgetTotal").value) || 0);
  const categories = {};
  document.querySelectorAll(".budget-input").forEach((x) => (categories[x.dataset.cat] = Math.max(0, Number(x.value) || 0)));
  const rollover = document.getElementById("budgetRollover").checked;
  await Api.saveBudget({ total, categories, rollover });
  await refreshState();
  closeModal(); renderHome(); renderInsights(); toast("Budget updated");
}

// ---------------------------------------------------------------------------
// Modal / toast
// ---------------------------------------------------------------------------
function openModal(title, body) { document.getElementById("modalTitle").textContent = title; document.getElementById("modalBody").innerHTML = body; document.getElementById("modal").classList.add("open"); }
function closeModal() { document.getElementById("modal").classList.remove("open"); }
function toast(msg) { const e = document.createElement("div"); e.className = "toast"; e.textContent = msg; document.querySelector(".main").appendChild(e); setTimeout(() => e.remove(), 2200); }
function successToast(msg) { const e = document.createElement("div"); e.className = "toast toast-success"; e.textContent = msg; document.querySelector(".main").appendChild(e); setTimeout(() => e.remove(), 2000); }

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
async function refreshState() {
  state = await Api.bootstrap();
}
function renderAll() {
  setGreeting();
  renderHome();
  renderTransactions();
  renderInsights();
  renderProfile();
}
function handleIntegrationRedirects() {
  const params = new URLSearchParams(window.location.search);
  const aa = params.get("aa"), gmail = params.get("gmail");
  if (aa === "connected") toast("Bank account connected");
  else if (aa) toast(`Bank connection: ${aa}`);
  if (gmail === "connected") toast("Gmail connected");
  else if (gmail === "error") toast("Gmail connection failed");
  if (aa || gmail) window.history.replaceState({}, "", "/");
}

(async function init() {
  try {
    await Api.me();
  } catch {
    return; // api.js already redirects to /login.html on 401
  }
  await refreshState();
  document.getElementById("date").value = todayKey();
  tickClock();
  setInterval(tickClock, 30000);
  handleIntegrationRedirects();
  renderAll();
})();
