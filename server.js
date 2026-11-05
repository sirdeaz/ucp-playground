// Minimal UCP-style merchant: "Clearview Autoglas" (car glass repair/replacement booking).
// In-memory, no dependencies. Booking endpoints are modelled on UCP's checkout/booking shape, simplified.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, "public");
const CURRENCY = "EUR";
const VAT = 0.21;
const DEPOSIT_RATE = 0.2;

// Prices are what a customer without glass insurance pays (VAT incl.). Insured customers pay nothing
// ("usually free" in practice): the insurer is billed instead. Replacement prices are demo estimates;
// a real shop quotes them per car and glass type.
const SERVICES = [
  { id: "chip_repair", title: "Repair a stone chip", description: "Chip smaller than a €2 coin and more than 6 cm from the edge. Lifetime guarantee.", price: 16417, duration_min: 45, mobile: true, walk_in: true, estimate: false },
  { id: "windscreen", title: "Replace windscreen", description: "Original-quality glass, fitted and sealed.", price: 42000, duration_min: 120, mobile: true, estimate: true },
  { id: "side_window", title: "Replace side window", description: "A broken side window must always be replaced.", price: 21000, duration_min: 90, mobile: true, estimate: true },
  { id: "rear_window", title: "Replace rear window", description: "Including heating element connection.", price: 29000, duration_min: 120, mobile: false, estimate: true },
  { id: "panoramic_roof", title: "Replace panoramic roof", description: "Glass roof replacement.", price: 78000, duration_min: 180, mobile: false, estimate: true },
  { id: "adas", title: "Recalibrate cameras & sensors", description: "Driver-assistance recalibration after glass work.", price: 12000, duration_min: 60, mobile: false, estimate: false },
];

const LOCATIONS = [
  { id: "ant", province: "Antwerpen", title: "Antwerpen", address: "Singel 210, 2600 Berchem" },
  { id: "mec", province: "Antwerpen", title: "Mechelen", address: "Nekkerspoelstraat 120, 2800 Mechelen" },
  { id: "bxl", province: "Brussel", title: "Elsene", address: "Waterloosesteenweg 300, 1050 Elsene" },
  { id: "gan", province: "Brussel", title: "Ganshoren", address: "Leopold I-laan 400, 1083 Ganshoren" },
  { id: "gnt", province: "Oost-Vlaanderen", title: "Gent", address: "Pantserschipstraat 88, 9000 Gent" },
  { id: "has", province: "Limburg", title: "Hasselt", address: "Kempische Steenweg 210, 3500 Hasselt" },
  { id: "chr", province: "Henegouwen", title: "Charleroi", address: "Boulevard Joseph Tirou 90, 6000 Charleroi" },
  { id: "lgg", province: "Luik", title: "Luik – Herstal", address: "Rue Hoche 5, 4040 Herstal" },
  { id: "home", province: "Aan huis", title: "At home or work", address: "We come to you", mobile: true },
];
const TIMES = ["08:00", "10:00", "13:00", "15:00"];
const SLOT_CAPACITY = 2;

const sessions = new Map();
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data", "bookings.json");
const bookings = new Map();
try {
  for (const b of JSON.parse(fs.readFileSync(DATA_FILE, "utf8"))) bookings.set(b.id, b);
} catch (e) {
  if (e.code !== "ENOENT") console.error("Could not load bookings:", e.message);
}
// Write to a temp file then rename so a crash never leaves a half-written file.
function saveBookings() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify([...bookings.values()], null, 2));
  fs.renameSync(tmp, DATA_FILE);
}
const newId = (p) => `${p}_${crypto.randomBytes(5).toString("hex")}`;

class HttpError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

// Belgian plates: 1-ABC-123 (also accepted without dashes, any case).
const normalizePlate = (p) => {
  const m = String(p || "").toUpperCase().replace(/[\s-]/g, "").match(/^([1-9])([A-Z]{3})(\d{3})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};

function bookableDates() {
  const out = [];
  const d = new Date();
  while (out.length < 10) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const taken = (location, date, time) =>
  [...bookings.values()].filter((b) => b.status === "confirmed" && b.location.id === location && b.slot.date === date && b.slot.time === time).length;

function availability(location, serviceMobile) {
  const loc = LOCATIONS.find((l) => l.id === location);
  if (!loc) throw new HttpError(400, "invalid_location", "Unknown location");
  return bookableDates().map((date) => ({
    date,
    times: TIMES.map((time) => ({ time, available: SLOT_CAPACITY - taken(location, date, time) > 0 })),
  }));
}

// The merchant is the source of truth: price, validation, and availability are computed here.
function evaluate(s) {
  const messages = [];
  const svc = SERVICES.find((x) => x.id === s.service_id);
  const loc = LOCATIONS.find((x) => x.id === s.location_id);
  if (!svc) messages.push({ type: "info", code: "missing_service", content: "Choose a service" });
  if (!s.vehicle?.plate) messages.push({ type: "info", code: "missing_plate", content: "Licence plate required" });
  else if (!normalizePlate(s.vehicle.plate)) messages.push({ type: "error", code: "invalid_plate", content: "Belgian plate format expected, e.g. 1-ABC-123" });
  if (!loc) messages.push({ type: "info", code: "missing_location", content: "Choose a location" });
  if (svc && loc?.mobile && !svc.mobile) messages.push({ type: "error", code: "not_mobile", content: `"${svc.title}" cannot be done at your location` });
  if (!s.slot) messages.push({ type: "info", code: "missing_slot", content: "Choose a date and time" });
  else if (loc) {
    if (!bookableDates().includes(s.slot.date) || !TIMES.includes(s.slot.time)) messages.push({ type: "error", code: "invalid_slot", content: "Slot is not bookable" });
    else if (taken(loc.id, s.slot.date, s.slot.time) >= SLOT_CAPACITY) messages.push({ type: "error", code: "slot_taken", content: "That slot was just taken, pick another" });
  }
  if (!s.contact?.name || !s.contact?.email || !s.contact?.phone) messages.push({ type: "info", code: "missing_contact", content: "Name, email and phone required" });
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.contact.email)) messages.push({ type: "error", code: "invalid_email", content: "Invalid email address" });

  const insured = !!s.insurance?.claim;
  if (!s.insurance) messages.push({ type: "info", code: "missing_insurance", content: "Tell us whether this is an insurance claim" });
  else if (insured && !s.insurance.company) messages.push({ type: "info", code: "missing_insurer", content: "Insurance company required" });

  const base = svc ? svc.price : 0;
  const total = insured ? 0 : base; // insurer is billed directly
  const vat = Math.round(total - total / (1 + VAT)); // prices are VAT-inclusive
  const deposit = Math.round(total * DEPOSIT_RATE);
  return {
    messages,
    status: messages.length ? "incomplete" : "ready_for_complete",
    totals: [
      { type: "service", amount: base },
      { type: "billed_to_insurer", amount: insured ? base : 0 },
      { type: "total", amount: total },
      { type: "vat_included", amount: vat },
      { type: "deposit_due_now", amount: deposit },
      { type: "balance_at_appointment", amount: total - deposit },
    ],
    service: svc || null,
    location: loc || null,
  };
}

function render(s) {
  const e = evaluate(s);
  return {
    ucp: { version: "draft-demo", capabilities: ["dev.ucp.shopping.booking"] },
    id: s.id,
    status: s.status === "completed" ? "completed" : s.status === "canceled" ? "canceled" : e.status,
    currency: CURRENCY,
    service: e.service && { id: e.service.id, title: e.service.title, duration_min: e.service.duration_min },
    location: e.location && { id: e.location.id, title: e.location.title },
    vehicle: s.vehicle || null,
    slot: s.slot || null,
    contact: s.contact || null,
    insurance: s.insurance || null,
    totals: e.totals,
    messages: e.messages,
    payment: { handlers: [{ id: "mock_pay" }] },
    booking_id: s.booking_id || null,
  };
}

function applyUpdate(s, b) {
  if (b.service_id !== undefined) {
    if (b.service_id && !SERVICES.some((x) => x.id === b.service_id)) throw new HttpError(400, "invalid_service", "Unknown service");
    s.service_id = b.service_id;
  }
  if (b.location_id !== undefined) {
    if (b.location_id && !LOCATIONS.some((x) => x.id === b.location_id)) throw new HttpError(400, "invalid_location", "Unknown location");
    s.location_id = b.location_id;
  }
  if (b.vehicle) {
    const plate = b.vehicle.plate !== undefined ? normalizePlate(b.vehicle.plate) || String(b.vehicle.plate).slice(0, 12) : s.vehicle?.plate;
    s.vehicle = { ...s.vehicle, ...b.vehicle, plate };
  }
  if (b.slot !== undefined) s.slot = b.slot && { date: String(b.slot.date), time: String(b.slot.time) };
  if (b.contact) s.contact = { ...s.contact, ...b.contact };
  if (b.insurance) s.insurance = { claim: !!b.insurance.claim, company: String(b.insurance.company || "").slice(0, 60) };
  if (b.language) s.language = ["nl", "fr", "en"].includes(b.language) ? b.language : "nl";
}

function getSession(id) {
  const s = sessions.get(id);
  if (!s) throw new HttpError(404, "not_found", "Booking session not found");
  return s;
}
const mutable = (s) => { if (s.status !== "open") throw new HttpError(409, "session_closed", `Session is ${s.status}`); };

function route(method, url, body) {
  const p = url.pathname;
  if (method === "GET" && p === "/.well-known/ucp") {
    return [200, {
      ucp: {
        version: "draft-demo",
        services: { "dev.ucp.shopping": { rest: { endpoint: "/api" } } },
        capabilities: [{ name: "dev.ucp.shopping.catalog" }, { name: "dev.ucp.shopping.booking" }],
      },
      merchant: { name: "Clearview Autoglas", merchant_of_record: true },
      payment: { handlers: [{ id: "mock_pay", name: "Mock Pay (demo, no real money)" }] },
    }];
  }
  if (method === "GET" && p === "/api/services") return [200, { services: SERVICES.map(({ id, title, description, price, duration_min, mobile, walk_in, estimate }) => ({ id, title, description, duration_min, mobile_possible: mobile, walk_in: !!walk_in, price_is_estimate: estimate, price: { amount: price, currency: CURRENCY } })) }];
  if (method === "GET" && p === "/api/locations") return [200, { locations: LOCATIONS }];
  if (method === "GET" && p === "/api/availability") {
    return [200, { location_id: url.searchParams.get("location"), days: availability(url.searchParams.get("location")) }];
  }
  if (method === "POST" && p === "/api/booking-sessions") {
    const s = { id: newId("bks"), status: "open" };
    applyUpdate(s, body);
    sessions.set(s.id, s);
    return [201, render(s)];
  }
  let m = p.match(/^\/api\/booking-sessions\/([\w-]+)$/);
  if (m) {
    const s = getSession(m[1]);
    if (method === "GET") return [200, render(s)];
    if (method === "PUT") { mutable(s); applyUpdate(s, body); return [200, render(s)]; }
  }
  m = p.match(/^\/api\/booking-sessions\/([\w-]+)\/(complete|cancel)$/);
  if (m && method === "POST") {
    const s = getSession(m[1]);
    mutable(s);
    if (m[2] === "cancel") { s.status = "canceled"; return [200, render(s)]; }
    const view = render(s);
    if (view.status !== "ready_for_complete") throw new HttpError(422, "not_ready", "Session is not ready: " + view.messages.map((x) => x.content).join("; "));
    const { handler_id: handler, token } = body.payment || {};
    const get = (t) => view.totals.find((x) => x.type === t).amount;
    if (get("deposit_due_now") > 0) {
      if (handler !== "mock_pay") throw new HttpError(400, "unknown_payment_handler", "Use handler_id 'mock_pay'");
      if (!token) throw new HttpError(400, "missing_payment_token", "payment.token required (try tok_success)");
      if (token === "tok_declined") throw new HttpError(402, "payment_declined", "Deposit payment declined");
    }
    const loc = LOCATIONS.find((x) => x.id === s.location_id);
    const booking = {
      id: newId("bk"), status: "confirmed", reference: crypto.randomBytes(3).toString("hex").toUpperCase(),
      service: view.service, location: { id: loc.id, title: loc.title, address: loc.address }, vehicle: s.vehicle, slot: s.slot, contact: s.contact, insurance: s.insurance,
      total: { amount: get("total"), currency: CURRENCY }, billed_to_insurer: { amount: get("billed_to_insurer"), currency: CURRENCY },
      deposit_paid: { amount: get("deposit_due_now"), currency: CURRENCY }, balance_due: { amount: get("balance_at_appointment"), currency: CURRENCY },
      language: s.language || "nl", created_at: new Date().toISOString(),
    };
    bookings.set(booking.id, booking);
    saveBookings();
    s.status = "completed";
    s.booking_id = booking.id;
    return [200, { ...render(s), booking }];
  }
  if (method === "GET" && p === "/api/bookings") {
    const list = [...bookings.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return [200, { bookings: list }];
  }
  if (method === "GET" && p === "/api/bookings/lookup") {
    const ref = (url.searchParams.get("reference") || "").trim().toUpperCase();
    const plate = normalizePlate(url.searchParams.get("plate"));
    const b = [...bookings.values()].find((x) => x.reference === ref && x.vehicle.plate === plate);
    if (!b) throw new HttpError(404, "not_found", "No booking matches that reference and plate");
    return [200, b];
  }
  m = p.match(/^\/api\/bookings\/([\w-]+)$/);
  if (m && method === "PUT") {
    const b = bookings.get(m[1]);
    if (!b) throw new HttpError(404, "not_found", "Booking not found");
    if (b.status !== "confirmed") throw new HttpError(409, "not_confirmed", `Booking is ${b.status}`);
    const slot = body.slot && { date: String(body.slot.date), time: String(body.slot.time) };
    if (!slot || !bookableDates().includes(slot.date) || !TIMES.includes(slot.time)) throw new HttpError(400, "invalid_slot", "Slot is not bookable");
    const same = b.slot.date === slot.date && b.slot.time === slot.time;
    if (!same && taken(b.location.id, slot.date, slot.time) >= SLOT_CAPACITY) throw new HttpError(409, "slot_taken", "That slot is taken");
    b.slot = slot;
    saveBookings();
    return [200, b];
  }
  if (m && method === "GET") {
    const b = bookings.get(m[1]);
    if (!b) throw new HttpError(404, "not_found", "Booking not found");
    return [200, b];
  }
  if (m && method === "DELETE") {
    const b = bookings.get(m[1]);
    if (!b) throw new HttpError(404, "not_found", "Booking not found");
    b.status = "canceled";
    saveBookings();
    return [200, b];
  }
  return null;
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };

const PAGES = { "/": "booking.html", "/bookings": "bookings.html", "/manage": "manage.html" };

function serveStatic(res, pathname) {
  const file = path.normalize(path.join(PUBLIC, PAGES[pathname] || pathname));
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
  let size = 0;
  req.on("data", (c) => { size += c.length; if (size < 1e6) chunks.push(c); });
  req.on("end", () => {
    const send = (status, obj) => res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(obj));
    try {
      if (size >= 1e6) throw new HttpError(413, "too_large", "Body too large");
      let body = {};
      const raw = Buffer.concat(chunks).toString();
      if (raw) { try { body = JSON.parse(raw); } catch { throw new HttpError(400, "invalid_json", "Body must be JSON"); } }
      if (!(url.pathname.startsWith("/api/") || url.pathname === "/.well-known/ucp")) return serveStatic(res, url.pathname);
      const result = route(req.method, url, body);
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
  server.listen(PORT, () => console.log(`Clearview Autoglas running at http://localhost:${PORT}`));
}
module.exports = server;
