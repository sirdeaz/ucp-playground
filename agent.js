// A tiny "shopping agent": discovers the merchant, searches, and buys a book purely via the API.
// Usage: node agent.js "dune" [quantity]   (server must be running)
const BASE = process.env.BASE_URL || "http://localhost:3000";
const [query = "dune", qty = "1"] = process.argv.slice(2);

async function call(method, path, body) {
  const res = await fetch(BASE + path, { method, headers: { "content-type": "application/json" }, body: body && JSON.stringify(body) });
  const data = await res.json();
  console.log(`${method} ${path} -> ${res.status}`);
  if (!res.ok) throw new Error(data.error?.message || res.statusText);
  return data;
}

(async () => {
  const profile = await call("GET", "/.well-known/ucp");
  console.log(`Merchant: ${profile.merchant.name}, capabilities: ${profile.ucp.capabilities.map((c) => c.name).join(", ")}`);

  const { items } = await call("GET", `/api/catalog?q=${encodeURIComponent(query)}`);
  const book = items.find((b) => b.availability !== "out_of_stock");
  if (!book) throw new Error(`No available book matches "${query}"`);
  console.log(`Chosen: ${book.title} by ${book.author} (${book.price.amount / 100} ${book.price.currency})`);

  let s = await call("POST", "/api/checkout-sessions", { line_items: [{ item: { id: book.id }, quantity: Number(qty) }] });
  s = await call("PUT", `/api/checkout-sessions/${s.id}`, {
    buyer: { name: "Ada Agent", email: "ada@example.com" },
    fulfillment: { address: { street: "1 Protocol Way", city: "Amsterdam", postal_code: "1011AB" }, selected_option_id: "standard" },
  });
  console.log(`Status: ${s.status}, total: ${s.totals.find((t) => t.type === "total").amount / 100}`);

  const done = await call("POST", `/api/checkout-sessions/${s.id}/complete`, { payment: { handler_id: "mock_pay", token: "tok_success" } });
  console.log(`Order ${done.order.id} ${done.order.status}`);
})().catch((e) => { console.error("Agent failed:", e.message); process.exit(1); });
