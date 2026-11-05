// Minimal UCP-style merchant: "Page & Co. Books". In-memory, no dependencies.
// Endpoints follow the shape of UCP's checkout capability but are simplified.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, "public");

const BOOKS = [
  { id: "bk_dune", title: "Dune", author: "Frank Herbert", price: 1099, stock: 12, genre: "Sci-Fi", color: "#c2410c" },
  { id: "bk_hobbit", title: "The Hobbit", author: "J.R.R. Tolkien", price: 999, stock: 8, genre: "Fantasy", color: "#15803d" },
  { id: "bk_1984", title: "1984", author: "George Orwell", price: 899, stock: 20, genre: "Classic", color: "#b91c1c" },
  { id: "bk_pride", title: "Pride and Prejudice", author: "Jane Austen", price: 799, stock: 5, genre: "Classic", color: "#be185d" },
  { id: "bk_sapiens", title: "Sapiens", author: "Yuval Noah Harari", price: 1499, stock: 15, genre: "Non-fiction", color: "#0369a1" },
  { id: "bk_neuro", title: "Neuromancer", author: "William Gibson", price: 1049, stock: 3, genre: "Sci-Fi", color: "#6d28d9" },
  { id: "bk_pragmatic", title: "The Pragmatic Programmer", author: "Hunt & Thomas", price: 3999, stock: 10, genre: "Tech", color: "#0f766e" },
  { id: "bk_mockingbird", title: "To Kill a Mockingbird", author: "Harper Lee", price: 949, stock: 0, genre: "Classic", color: "#a16207" },
];

const SHIPPING = [
  { id: "standard", title: "Standard (3-5 days)", price: 499, free_over: 3000 },
  { id: "express", title: "Express (1-2 days)", price: 1299, free_over: null },
];
const TAX_RATE = 0.08;
const CURRENCY = "USD";

const sessions = new Map();
const orders = new Map();
const newId = (p) => `${p}_${crypto.randomBytes(5).toString("hex")}`;

const profile = () => ({
  ucp: {
    version: "draft-demo",
    services: { "dev.ucp.shopping": { rest: { endpoint: "/api" } } },
    capabilities: [
      { name: "dev.ucp.shopping.catalog" },
      { name: "dev.ucp.shopping.checkout" },
      { name: "dev.ucp.shopping.order" },
    ],
  },
  merchant: { name: "Page & Co. Books", merchant_of_record: true },
  payment: { handlers: [{ id: "mock_pay", name: "Mock Pay (demo, no real money)" }] },
});

const publicBook = (b) => ({
  id: b.id, title: b.title, author: b.author, genre: b.genre, color: b.color,
  price: { amount: b.price, currency: CURRENCY },
  availability: b.stock > 3 ? "in_stock" : b.stock > 0 ? "low_stock" : "out_of_stock",
});

class HttpError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

// The merchant is the source of truth: totals are always recomputed here.
function price(session) {
  const messages = [];
  const lines = [];
  for (const li of session.line_items) {
    const book = BOOKS.find((b) => b.id === li.item.id);
    if (!book) { messages.push({ type: "error", code: "item_not_found", path: `$.line_items`, content: `Unknown item ${li.item.id}` }); continue; }
    const quantity = Number.isInteger(li.quantity) && li.quantity > 0 ? li.quantity : 0;
    if (!quantity) { messages.push({ type: "error", code: "invalid_quantity", content: `Invalid quantity for ${book.title}` }); continue; }
    if (quantity > book.stock) {
      messages.push({ type: "error", code: "insufficient_stock", content: `Only ${book.stock} copies of "${book.title}" available` });
    }
    lines.push({ id: li.id, item: { id: book.id, title: book.title, price: book.price }, quantity, total: book.price * quantity });
  }
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const option = SHIPPING.find((o) => o.id === session.fulfillment?.selected_option_id);
  const shipping = !option ? 0 : option.free_over && subtotal >= option.free_over ? 0 : option.price;
  const tax = Math.round((subtotal + shipping) * TAX_RATE);
  const b = session.buyer || {};
  const addr = session.fulfillment?.address || {};
  if (!lines.length) messages.push({ type: "error", code: "empty_cart", content: "Cart is empty" });
  if (!b.email || !b.name) messages.push({ type: "info", code: "missing_buyer", content: "Buyer name and email required" });
  if (!addr.street || !addr.city || !addr.postal_code) messages.push({ type: "info", code: "missing_address", content: "Shipping address required" });
  if (!option) messages.push({ type: "info", code: "missing_shipping", content: "Select a shipping option" });
  const blocking = messages.length > 0;
  return {
    line_items: lines,
    messages,
    totals: [
      { type: "subtotal", amount: subtotal },
      { type: "shipping", amount: shipping },
      { type: "tax", amount: tax },
      { type: "total", amount: subtotal + shipping + tax },
    ],
    status: blocking ? "incomplete" : "ready_for_complete",
  };
}

function render(s) {
  const priced = price(s);
  return {
    ucp: { version: "draft-demo", capabilities: ["dev.ucp.shopping.checkout"] },
    id: s.id,
    status: s.status === "completed" ? "completed" : s.status === "canceled" ? "canceled" : priced.status,
    currency: CURRENCY,
    buyer: s.buyer || null,
    line_items: priced.line_items,
    fulfillment: { address: s.fulfillment?.address || null, selected_option_id: s.fulfillment?.selected_option_id || null, options: SHIPPING.map(({ id, title, price: p, free_over }) => ({ id, title, price: p, free_over })) },
    totals: priced.totals,
    messages: priced.messages,
    payment: { handlers: [{ id: "mock_pay" }] },
    order_id: s.order_id || null,
  };
}

function applyUpdate(s, body) {
  if (Array.isArray(body.line_items)) {
    s.line_items = body.line_items.map((li) => ({ id: li.id || newId("li"), item: { id: li.item?.id }, quantity: li.quantity }));
  }
  if (body.buyer) s.buyer = { ...s.buyer, ...body.buyer };
  if (body.fulfillment) {
    s.fulfillment = { ...s.fulfillment, ...body.fulfillment };
    if (body.fulfillment.selected_option_id && !SHIPPING.some((o) => o.id === body.fulfillment.selected_option_id)) {
      throw new HttpError(400, "invalid_shipping_option", "Unknown shipping option");
    }
  }
}

function getSession(id) {
  const s = sessions.get(id);
  if (!s) throw new HttpError(404, "not_found", "Checkout session not found");
  return s;
}
const mutable = (s) => {
  if (s.status !== "open") throw new HttpError(409, "session_closed", `Session is ${s.status}`);
};

function route(method, url, body) {
  const p = url.pathname;
  if (method === "GET" && p === "/.well-known/ucp") return [200, profile()];

  if (method === "GET" && p === "/api/catalog") {
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const items = BOOKS.filter((b) => !q || [b.title, b.author, b.genre].some((f) => f.toLowerCase().includes(q))).map(publicBook);
    return [200, { items }];
  }

  if (method === "POST" && p === "/api/checkout-sessions") {
    const s = { id: newId("chk"), status: "open", line_items: [], buyer: null, fulfillment: null };
    applyUpdate(s, body);
    sessions.set(s.id, s);
    return [201, render(s)];
  }

  let m = p.match(/^\/api\/checkout-sessions\/([\w-]+)$/);
  if (m) {
    const s = getSession(m[1]);
    if (method === "GET") return [200, render(s)];
    if (method === "PUT") { mutable(s); applyUpdate(s, body); return [200, render(s)]; }
  }

  m = p.match(/^\/api\/checkout-sessions\/([\w-]+)\/(complete|cancel)$/);
  if (m && method === "POST") {
    const s = getSession(m[1]);
    mutable(s);
    if (m[2] === "cancel") { s.status = "canceled"; return [200, render(s)]; }
    const view = render(s);
    if (view.status !== "ready_for_complete") throw new HttpError(422, "not_ready", "Session is not ready: " + view.messages.map((x) => x.content).join("; "));
    const handler = body.payment?.handler_id, token = body.payment?.token;
    if (handler !== "mock_pay") throw new HttpError(400, "unknown_payment_handler", "Use handler_id 'mock_pay'");
    if (token === "tok_declined") throw new HttpError(402, "payment_declined", "Payment declined by handler");
    if (!token) throw new HttpError(400, "missing_payment_token", "payment.token required (try tok_success)");
    for (const li of view.line_items) BOOKS.find((b) => b.id === li.item.id).stock -= li.quantity;
    const total = view.totals.find((t) => t.type === "total").amount;
    const order = { id: newId("ord"), status: "confirmed", checkout_id: s.id, buyer: s.buyer, line_items: view.line_items, shipping_address: s.fulfillment.address, total: { amount: total, currency: CURRENCY }, created_at: new Date().toISOString(), fulfillment: { status: "processing" } };
    orders.set(order.id, order);
    s.status = "completed";
    s.order_id = order.id;
    return [200, { ...render(s), order }];
  }

  m = p.match(/^\/api\/orders\/([\w-]+)$/);
  if (m && method === "GET") {
    const o = orders.get(m[1]);
    if (!o) throw new HttpError(404, "not_found", "Order not found");
    return [200, o];
  }
  return null;
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };

function serveStatic(res, pathname) {
  const file = path.normalize(path.join(PUBLIC, pathname === "/" ? "index.html" : pathname));
  if (!file.startsWith(PUBLIC + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
    return;
  }
  res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const chunks = [];
  req.on("data", (c) => { chunks.push(c); if (chunks.length > 200) req.destroy(); });
  req.on("end", () => {
    const send = (status, obj) => res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(obj));
    try {
      let body = {};
      const raw = Buffer.concat(chunks).toString();
      if (raw) { try { body = JSON.parse(raw); } catch { throw new HttpError(400, "invalid_json", "Body must be JSON"); } }
      const result = url.pathname.startsWith("/api/") || url.pathname === "/.well-known/ucp" ? route(req.method, url, body) : "static";
      if (result === "static") return serveStatic(res, url.pathname);
      if (!result) throw new HttpError(404, "not_found", `No route for ${req.method} ${url.pathname}`);
      send(...result);
    } catch (e) {
      if (e instanceof HttpError) return send(e.status, { error: { code: e.code, message: e.message } });
      console.error(e);
      send(500, { error: { code: "internal", message: "Internal error" } });
    }
  });
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`Page & Co. Books running at http://localhost:${PORT}`));
}
module.exports = server;
