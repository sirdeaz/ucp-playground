// A tiny "agent": discovers the garage and books a windscreen job purely via the API.
// Usage: node agent.js [service_id] [plate] [insured|self]   (server must be running)
const BASE = process.env.BASE_URL || "http://localhost:3000";
const [serviceQuery = "windscreen", plate = "1-ABC-123", mode = "insured"] = process.argv.slice(2);

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

  const { services } = await call("GET", "/api/services");
  const service = services.find((s) => s.id === serviceQuery);
  if (!service) throw new Error(`Unknown service. Options: ${services.map((s) => s.id).join(", ")}`);

  const { locations } = await call("GET", "/api/locations");
  const location = locations.find((l) => !l.mobile);
  const { days } = await call("GET", `/api/availability?location=${location.id}`);
  const day = days.find((d) => d.times.some((t) => t.available));
  const time = day.times.find((t) => t.available).time;
  console.log(`Chosen: ${service.title} at ${location.title} on ${day.date} ${time}`);

  let s = await call("POST", "/api/booking-sessions", {
    service_id: service.id, location_id: location.id, vehicle: { plate }, slot: { date: day.date, time },
    contact: { name: "Ada Agent", email: "ada@example.com", phone: "+32470000000" },
    insurance: mode === "insured" ? { claim: true, company: "Demo Insurance" } : { claim: false },
  });
  console.log(`Status: ${s.status}, total: ${s.totals.find((t) => t.type === "total").amount / 100} EUR`);

  const done = await call("POST", `/api/booking-sessions/${s.id}/complete`, s.totals.find((t) => t.type === "deposit_due_now").amount > 0 ? { payment: { handler_id: "mock_pay", token: "tok_success" } } : {});
  console.log(`Booking ${done.booking.reference} ${done.booking.status} (${done.booking.id})`);
})().catch((e) => { console.error("Agent failed:", e.message); process.exit(1); });
