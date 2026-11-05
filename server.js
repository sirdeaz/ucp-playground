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

const SERVICES = [
  { id: "chip_repair", title: "Chip / crack repair", description: "Resin repair of stone chips up to 2 cm. Usually 30 min.", price: 5900, duration_min: 30, mobile: true },
  { id: "windscreen", title: "Windscreen replacement", description: "New windscreen incl. fitting, sealing and recalibration check.", price: 32000, duration_min: 90, mobile: true },
  { id: "side_window", title: "Side window replacement", description: "Front or rear door window.", price: 17500, duration_min: 75, mobile: true },
  { id: "rear_window", title: "Rear window replacement", description: "Rear window incl. heating element connection.", price: 24500, duration_min: 90, mobile: false },
  { id: "adas", title: "ADAS camera recalibration", description: "Required after many windscreen replacements.", price: 9500, duration_min: 45, mobile: false },
];

const LOCATIONS = [
  { id: "bxl", title: "Brussels – Anderlecht", address: "Rue des Goujons 12, 1070 Anderlecht" },
  { id: "ant", title: "Antwerp – Berchem", address: "Singel 210, 2600 Berchem" },
  { id: "gnt", title: "Ghent – Sint-Denijs-Westrem", address: "Pantserschipstraat 88, 9000 Gent" },
  { id: "lgg", title: "Liège – Herstal", address: "Rue Hoche 5, 4040 Herstal" },
  { id: "home", title: "Mobile – we come to you", address: "At your home or work (+€25)", mobile: true },
];
const MOBILE_FEE = 2500;
const TIMES = ["08:00", "10:00", "13:00", "15:00"];
const SLOT_CAPACITY = 2;

const sessions = new Map();
const bookings = new Map();
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

  const base = svc ? svc.price : 0;
  const mobile = loc?.mobile ? MOBILE_FEE : 0;
  const total = base + mobile;
  const vat = Math.round(total - total / (1 + VAT)); // prices are VAT-inclusive
  const deposit = Math.round(total * DEPOSIT_RATE);
  return {
    messages,
    status: messages.length ? "incomplete" : "ready_for_complete",
    totals: [
      { type: "service", amount: base },
      { type: "mobile_fee", amount: mobile },
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
  if (method === "GET" && p === "/api/services") return [200, { services: SERVICES.map(({ id, title, description, price, duration_min, mobile }) => ({ id, title, description, duration_min, mobile_possible: mobile, price: { amount: price, currency: CURRENCY } })) }];
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
    if (handler !== "mock_pay") throw new HttpError(400, "unknown_payment_handler", "Use handler_id 'mock_pay'");
    if (!token) throw new HttpError(400, "missing_payment_token", "payment.token required (try tok_success)");
    if (token === "tok_declined") throw new HttpError(402, "payment_declined", "Deposit payment declined");
    const loc = LOCATIONS.find((x) => x.id === s.location_id);
    const get = (t) => view.totals.find((x) => x.type === t).amount;
    const booking = {
      id: newId("bk"), status: "confirmed", reference: crypto.randomBytes(3).toString("hex").toUpperCase(),
      service: view.service, location: { id: loc.id, title: loc.title, address: loc.address }, vehicle: s.vehicle, slot: s.slot, contact: s.contact, insurance: s.insurance || null,
      total: { amount: get("total"), currency: CURRENCY }, deposit_paid: { amount: get("deposit_due_now"), currency: CURRENCY }, balance_due: { amount: get("balance_at_appointment"), currency: CURRENCY },
      created_at: new Date().toISOString(),
    };
    bookings.set(booking.id, booking);
    s.status = "completed";
    s.booking_id = booking.id;
    return [200, { ...render(s), booking }];
  }
  m = p.match(/^\/api\/bookings\/([\w-]+)$/);
  if (m && method === "GET") {
    const b = bookings.get(m[1]);
    if (!b) throw new HttpError(404, "not_found", "Booking not found");
    return [200, b];
  }
  if (m && method === "DELETE") {
    const b = bookings.get(m[1]);
    if (!b) throw new HttpError(404, "not_found", "Booking not found");
    b.status = "canceled";
    return [200, b];
  }
  return null;
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml" };

function serveStatic(res, pathname) {
  const file = path.normalize(path.join(PUBLIC, pathname === "/" ? "booking.html" : pathname));
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
