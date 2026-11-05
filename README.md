# UCP Playground

Learning demos for the [Universal Commerce Protocol](https://ucp.dev/). Everything is fictional: no real payments, no real data, and the API is a simplified UCP-style subset, not a spec-complete implementation.

## 1. Working demo: car glass booking (`server.js`)

A zero-dependency Node (18+) merchant, **Clearview Autoglas** (an original, fictional brand), with a multi-step booking site and a live protocol log. Book a windscreen or window job: service, Belgian licence plate, branch or mobile service, date/time slot, contact details, and insurance details, and (for uninsured customers) a 20% deposit through a mock payment handler. The UI is available in NL/FR/EN, styled after carglass.be's flow (no Carglass assets used). Prices for replacements are demo estimates; addresses are invented.

```
node server.js          # then open http://localhost:3000
```

Use `PORT=8080 node server.js` to change the port.

### API

| Method | Path | Purpose |
|---|---|---|
| GET | `/.well-known/ucp` | Discovery profile: capabilities, payment handlers |
| GET | `/api/services` | Services and VAT-inclusive prices |
| GET | `/api/locations` | Branches plus mobile service |
| GET | `/api/availability?location=bxl` | Bookable days and time slots |
| POST | `/api/booking-sessions` | Create a booking session |
| PUT | `/api/booking-sessions/:id` | Update service, location, vehicle, slot, contact, insurance |
| POST | `/api/booking-sessions/:id/complete` | Pay the deposit with `{"payment":{"handler_id":"mock_pay","token":"tok_success"}}` (`tok_declined` simulates a decline) |
| POST | `/api/booking-sessions/:id/cancel` | Cancel the session |
| GET / PUT / DELETE | `/api/bookings/:id` | Read, reschedule (`{"slot":{...}}`) or cancel a confirmed booking |
| GET | `/api/bookings/lookup?reference=&plate=` | Find a booking (used by `/manage`) |

The merchant validates the plate (`1-ABC-123`), checks slot capacity (2 per branch and slot), whether a service can be done mobile, and computes totals (21% VAT included). A session is `incomplete` until everything is valid, then `ready_for_complete`. Insured customers (`insurance:{claim:true,company}`) pay nothing and need no payment step; the amount is `billed_to_insurer`. Others pay a 20% deposit.

Customers can reschedule or cancel at http://localhost:3000/manage ("Beheer je afspraak").

### Bookings page and persistence

Open http://localhost:3000/bookings for a public list of all bookings (filter, auto-refresh, cancel). Confirmed bookings are saved to `data/bookings.json` (git-ignored; override with `DATA_FILE=/path/file.json`) and survive restarts. Booking sessions (unfinished carts) are in memory only. `GET /api/bookings` returns the same list as JSON.

### Try it as an agent

With the server running, a script books a job using only the API:

```
node agent.js windscreen 1-ABC-123 insured   # or: self
```

Service ids: `chip_repair`, `windscreen`, `side_window`, `rear_window`, `panoramic_roof`, `adas`. 

## 2. Concept walkthrough (`index.html`)

A static, click-through explanation of the UCP lifecycle: https://sirdeaz.github.io/ucp-playground/

## Learn more

- [UCP overview](https://ucp.dev/)
- [UCP technical specification](https://ucp.dev/latest/specification/overview/)
