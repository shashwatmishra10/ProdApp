function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function serializeTransaction(t: {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  type: string;
  payment: string;
  date: Date;
  source: string;
  notes: string | null;
  recurring: boolean;
  transferSide: string | null;
  account?: { name: string } | null;
}) {
  return {
    id: t.id,
    merchant: t.merchant,
    amount: t.amount,
    category: t.category,
    type: t.type,
    payment: t.payment,
    date: toDateOnly(t.date),
    source: t.source,
    notes: t.notes || "",
    recurring: t.recurring,
    transferSide: t.transferSide,
    account: t.account?.name || "Cash",
  };
}

export function serializeGoal(g: { id: string; name: string; target: number; saved: number; deadline: Date | null; icon: string | null }) {
  return {
    id: g.id,
    name: g.name,
    target: g.target,
    saved: g.saved,
    deadline: g.deadline ? toDateOnly(g.deadline) : null,
    icon: g.icon || "🎯",
  };
}

export function serializeSharedGroup(g: {
  id: string;
  name: string;
  date: Date;
  status: string;
  participants: { name: string; share: number; paid: number; settled: boolean }[];
}) {
  return {
    id: g.id,
    name: g.name,
    date: toDateOnly(g.date),
    status: g.status,
    participants: g.participants.map((p) => ({ name: p.name, share: p.share, paid: p.paid, settled: p.settled })),
  };
}
