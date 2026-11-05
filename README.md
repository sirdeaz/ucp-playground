# UCP Playground

Learning demos for the [Universal Commerce Protocol](https://ucp.dev/). Everything is fictional: no real payments, no real data, and the API is a simplified UCP-style subset, not a spec-complete implementation.

## 1. Working demo: car glass booking (`server.js`)

A zero-dependency Node (18+) merchant, **Clearview Autoglas** (an original, fictional brand), with a multi-step booking site and a live protocol log. Book a windscreen or window job: service, Belgian licence plate, branch or mobile service, date/time slot, contact details, and a 20% deposit through a mock payment handler.

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
| GET / DELETE | `/api/bookings/:id` | Read or cancel a confirmed booking |

The merchant validates the plate (`1-ABC-123`), checks slot capacity (2 per branch and slot), whether a service can be done mobile, and computes totals (21% VAT included, €25 mobile fee). A session is `incomplete` until everything is valid, then `ready_for_complete`.

### Try it as an agent

With the server running, a script books a job using only the API:

```
node agent.js windscreen 1-ABC-123
```

Service ids: `chip_repair`, `windscreen`, `side_window`, `rear_window`, `adas`. State is in memory and resets on restart.

## 2. Concept walkthrough (`index.html`)

A static, click-through explanation of the UCP lifecycle: https://sirdeaz.github.io/ucp-playground/

## Learn more

- [UCP overview](https://ucp.dev/)
- [UCP technical specification](https://ucp.dev/latest/specification/overview/)
