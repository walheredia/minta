# Frontend and API share one origin; auth uses httpOnly cookies

Next.js and NestJS are both served under `minta.appcont.com.ar` — the frontend at `/`, the API reverse-proxied at `/api` by the Apache vhost — rather than on separate subdomains. This lets authentication use httpOnly cookies (a short-lived access token plus a refresh token stored hashed in the database) with no CORS or cross-site cookie handling to manage. We rejected storing a JWT in `localStorage` with an `Authorization` header, since that exposes the token to theft via XSS in an app that handles financial data.
