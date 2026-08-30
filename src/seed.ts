import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { provisionNewUser } from "./utils/provision";

const DEMO_EMAIL = "demo@minto.app";
const DEMO_PASSWORD = "mintodemo123";

// Day-of-month anchors, not "days ago" — a fixed days-ago offset can drift
// into the previous calendar month depending on what day the seed runs
// (e.g. -27 days from the 5th lands last month), silently dropping the
// transaction out of every "this month" view. Anchoring to a day-of-month
// and clamping to today keeps every one of these reliably in the current
// month, regardless of when the demo is seeded or viewed.
const SEED_TRANSACTIONS: [string, number, string, string, string, number, string][] = [
  ["Salary", 45000, "Others", "HDFC Savings", "Bank transfer", 1, "INCOME"],
  ["Rent", 12000, "Rent", "HDFC Savings", "Bank transfer", 3, "EXPENSE"],
  ["Electricity", 1320, "Bills", "HDFC Savings", "UPI", 8, "EXPENSE"],
  ["Gym", 2000, "Health", "ICICI Savings", "UPI", 10, "EXPENSE"],
  ["Zomato", 620, "Food", "HDFC Savings", "UPI", 11, "EXPENSE"],
  ["Electricity Refund", 120, "Bills", "HDFC Savings", "UPI", 12, "REFUND"],
  ["Flipkart", 980, "Shopping", "Axis Credit Card", "Card", 14, "EXPENSE"],
  ["Starbucks", 540, "Food", "Cash", "Cash", 15, "EXPENSE"],
  ["Reliance Smart", 890, "Groceries", "HDFC Savings", "UPI", 17, "EXPENSE"],
  ["MakeMyTrip", 2200, "Travel", "Axis Credit Card", "Card", 18, "EXPENSE"],
  ["BookMyShow", 720, "Entertainment", "ICICI Savings", "UPI", 20, "EXPENSE"],
  ["Spotify", 119, "Subscriptions", "Axis Credit Card", "Card", 21, "EXPENSE"],
  ["Zomato", 650, "Food", "HDFC Savings", "UPI", 22, "EXPENSE"],
  ["Blinkit", 1120, "Groceries", "HDFC Savings", "UPI", 23, "EXPENSE"],
  ["Amazon", 1250, "Shopping", "Axis Credit Card", "Card", 24, "EXPENSE"],
  ["Amazon Refund", 250, "Shopping", "Axis Credit Card", "Card", 25, "REFUND"],
  ["Uber", 320, "Travel", "ICICI Savings", "UPI", 26, "EXPENSE"],
];

function dayOfMonth(day: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), Math.min(day, now.getDate()));
}
function daysFromNow(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) {
    console.log(`Demo user already exists (${DEMO_EMAIL}). Skipping seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const user = await prisma.user.create({
    data: { name: "Demo User", email: DEMO_EMAIL, passwordHash },
  });
  await provisionNewUser(user.id);
  // provisionNewUser already made a Budget with a default total; bump it to
  // match the demo narrative and keep total spend comfortably under the 80%
  // "approaching budget" alert threshold, so the demo reliably surfaces
  // exactly its two intended smart insights (top category + recurring
  // detected) rather than a third budget-alert one.
  await prisma.budget.update({ where: { userId: user.id }, data: { total: 40000 } });

  const accountNames = ["HDFC Savings", "ICICI Savings", "Axis Credit Card"];
  const accounts: Record<string, string> = {};
  for (const name of accountNames) {
    const acc = await prisma.account.create({
      data: { userId: user.id, name, type: name.includes("Credit") ? "CREDIT_CARD" : "SAVINGS", provider: "MANUAL" },
    });
    accounts[name] = acc.id;
  }
  const cash = await prisma.account.findUnique({ where: { userId_name: { userId: user.id, name: "Cash" } } });
  accounts["Cash"] = cash!.id;

  for (const [merchant, amount, category, account, payment, day, type] of SEED_TRANSACTIONS) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: accounts[account],
        merchant,
        amount,
        category,
        type,
        payment,
        date: dayOfMonth(day),
        source: "MANUAL",
        recurring: ["Netflix", "Spotify", "Rent", "Gym"].includes(merchant),
      },
    });
  }
  // One upcoming recurring charge, shown in "Upcoming" on Home.
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: accounts["Axis Credit Card"],
      merchant: "Netflix",
      amount: 649,
      category: "Subscriptions",
      type: "EXPENSE",
      payment: "Card",
      date: daysFromNow(1),
      source: "MANUAL",
      recurring: true,
    },
  });

  await prisma.goal.createMany({
    data: [
      { userId: user.id, name: "Emergency Fund", target: 100000, saved: 45000, icon: "🛟" },
      { userId: user.id, name: "Goa Trip", target: 30000, saved: 12000, icon: "✈️" },
    ],
  });

  await prisma.sharedGroup.create({
    data: {
      userId: user.id,
      name: "Weekend Dinner",
      date: dayOfMonth(21),
      status: "OPEN",
      participants: {
        create: [
          { name: "You", share: 800, paid: 2400, settled: true },
          { name: "Rahul", share: 800, paid: 0, settled: false },
          { name: "Priya", share: 800, paid: 0, settled: false },
        ],
      },
    },
  });

  console.log(`Seeded demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
