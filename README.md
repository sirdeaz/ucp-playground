# UCP Playground

Learning demos for the [Universal Commerce Protocol](https://ucp.dev/). Everything is fictional: no real payments, no real data, and the API is a simplified UCP-style subset, not a spec-complete implementation.

## 1. Working demo: book store (`server.js`)

A zero-dependency Node (18+) merchant, **Page & Co. Books**, with a storefront and a live protocol log.

```
node server.js          # then open http://localhost:3000
```

Use `PORT=8080 node server.js` to change the port.

In the browser: search, add books to the cart, enter buyer and shipping details, choose a shipping method and pay with the mock handler (approve or decline). The side panel logs every API call.

### API

| Method | Path | Purpose |
|---|---|---|
| GET | `/.well-known/ucp` | Discovery profile: capabilities, payment handlers |
| GET | `/api/catalog?q=` | Search books |
| POST | `/api/checkout-sessions` | Create a checkout session (cart) |
| PUT | `/api/checkout-sessions/:id` | Update items, buyer, shipping |
| POST | `/api/checkout-sessions/:id/complete` | Pay with `{"payment":{"handler_id":"mock_pay","token":"tok_success"}}` (`tok_declined` simulates a decline) |
| POST | `/api/checkout-sessions/:id/cancel` | Cancel |
| GET | `/api/orders/:id` | Order status |

The merchant recomputes prices, shipping (free over $30 on standard), tax (8%) and stock on every call. A session is `incomplete` until it has items, buyer, address and a shipping option, then becomes `ready_for_complete`.

### Try it as an agent

With the server running, a script buys a book using only the API:

```
node agent.js "neuromancer" 1
```

State is in memory and resets when the server restarts.

## 2. Concept walkthrough (`index.html`)

A static, click-through explanation of the UCP lifecycle: https://sirdeaz.github.io/ucp-playground/

## Learn more

- [UCP overview](https://ucp.dev/)
- [UCP technical specification](https://ucp.dev/latest/specification/overview/)
