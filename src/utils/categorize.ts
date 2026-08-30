const CATEGORY_HINTS: [RegExp, string][] = [
  [/swiggy|zomato|starbucks|dominos|food|restaurant/i, "Food"],
  [/uber|ola|irctc|makemytrip|indigo|flight|travel|cab/i, "Travel"],
  [/amazon|flipkart|myntra|shop/i, "Shopping"],
  [/blinkit|zepto|grocery|bigbasket|reliance smart/i, "Groceries"],
  [/netflix|spotify|prime|hotstar|subscription/i, "Subscriptions"],
  [/electricity|broadband|recharge|\bbill\b/i, "Bills"],
  [/\brent\b/i, "Rent"],
  [/bookmyshow|movie|entertainment/i, "Entertainment"],
  [/hospital|pharmacy|health|apollo|gym/i, "Health"],
  [/atm|withdrawal/i, "Others"],
];

/** Best-effort category guess from a bank narration or email subject/snippet. */
export function guessCategory(text: string): string {
  const hit = CATEGORY_HINTS.find(([re]) => re.test(text));
  return hit ? hit[1] : "Others";
}
