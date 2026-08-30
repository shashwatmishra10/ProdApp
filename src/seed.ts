import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { provisionNewUser } from "./utils/provision";

const DEMO_EMAIL = "demo@minto.app";
const DEMO_PASSWORD = "mintodemo123";

const SEED_TRANSACTIONS: [string, number, string, string, string, string, string][] = [
  ["Salary", 45000, "Others", "HDFC Savings", "Bank transfer", "-3", "INCOME"],
  ["Rent", 12000, "Rent", "HDFC Savings", "Bank transfer", "-27", "EXPENSE"],
  ["Gym", 2000, "Health", "ICICI Savings", "UPI", "-20", "EXPENSE"],
  ["Netflix", 649, "Subscriptions", "Axis Credit Card", "Card", "1", "EXPENSE"],
  ["Spotify", 119, "Subscriptions", "Axis Credit Card", "Card", "-8", "EXPENSE"],
  ["Swiggy", 650, "Food", "HDFC Savings", "UPI", "-3", "EXPENSE"],
  ["Uber", 320, "Travel", "ICICI Savings", "UPI", "-3", "EXPENSE"],
  ["Amazon", 1250, "Shopping", "Axis Credit Card", "Card", "-4", "EXPENSE"],
  ["Blinkit", 1120, "Groceries", "HDFC Savings", "UPI", "-5", "EXPENSE"],
  ["Zomato", 840, "Food", "HDFC Savings", "UPI", "-6", "EXPENSE"],
  ["BookMyShow", 720, "Entertainment", "ICICI Savings", "UPI", "-7", "EXPENSE"],
  ["MakeMyTrip", 3500, "Travel", "Axis Credit Card", "Card", "-10", "EXPENSE"],
  ["Reliance Smart", 890, "Groceries", "HDFC Savings", "UPI", "-12", "EXPENSE"],
  ["Starbucks", 540, "Food", "Cash", "Cash", "-13", "EXPENSE"],
  ["Flipkart", 980, "Shopping", "Axis Credit Card", "Card", "-15", "EXPENSE"],
  ["Electricity", 1320, "Bills", "HDFC Savings", "UPI", "-18", "EXPENSE"],
  ["Zomato", 620, "Food", "HDFC Savings", "UPI", "-19", "EXPENSE"],
  ["Amazon Refund", 250, "Shopping", "Axis Credit Card", "Card", "-16", "REFUND"],
];

function daysAgo(offset: number): Date {
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
  // provisionNewUser already made a Budget with a default total; bump it to match the demo narrative.
  await prisma.budget.update({ where: { userId: user.id }, data: { total: 30000 } });

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

  for (const [merchant, amount, category, account, payment, offset, type] of SEED_TRANSACTIONS) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: accounts[account],
        merchant,
        amount,
        category,
        type,
        payment,
        date: daysAgo(Number(offset)),
        source: "MANUAL",
        recurring: ["Netflix", "Spotify", "Rent", "Gym"].includes(merchant),
      },
    });
  }

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
      date: daysAgo(-9),
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
