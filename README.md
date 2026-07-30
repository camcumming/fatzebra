# Fat Zebra Integration Test Harnesses

Browser-based developer tools for testing the three primary [Fat Zebra](https://www.fatzebra.com) payment integration approaches against the sandbox environment. No backend required — everything runs client-side on GitHub Pages.

**Live:** https://camcumming.github.io/fatzebra/

---

## Integration approaches

### JS SDK (`fatzebra.js`)

Renders Fat Zebra's hosted payment form inside an iframe on your page using the `fatzebra.js` SDK. The SDK handles 3DS2 authentication in-page and surfaces outcomes via JavaScript events.

- **Credentials required:** `accessToken`, `username`, `sharedSecret`
- **Verification hash:** `HMAC-MD5(sharedSecret, "reference:amount:currency")`
- **Outcome events:** `fz.payment.success`, `fz.payment.error`, `fz.tokenization.success`, `fz.sca.success`
- **SDK CDN:** `https://cdn.pmnts-sandbox.io/sdk/v1/fatzebra.js`
- **Harness:** [`/fatzebra.js/harness.html`](https://camcumming.github.io/fatzebra/fatzebra.js/harness.html)

---

### V3 Hosted Payment Page

Redirects the buyer to Fat Zebra's fully hosted payment page, or embeds it in an iframe. The harness builds and signs the URL client-side; Fat Zebra redirects back to `return_path` with result parameters on completion.

- **Credentials required:** `username`, `sharedSecret`
- **Verification hash:** `HMAC-MD5(sharedSecret, "reference:amount:currency[:return_path][:cards]")` — field order depends on which optional parameters are included
- **Submission modes:** Redirect (full-page navigation), iFrame (embedded; adds `iframe=true` and `return_target=_parent`)
- **Base URL:** `https://paynow.pmnts-sandbox.io/v3/{username}/{reference}/{currency}/{amount}/{hash}`
- **Harness:** [`/v3/harness.html`](https://camcumming.github.io/fatzebra/v3/harness.html)
- **Callback:** [`/v3/callback.html`](https://camcumming.github.io/fatzebra/v3/callback.html)

---

### Direct Post

Posts card details directly to the Fat Zebra gateway from the browser. Supports two submission modes:

| Mode | Mechanism | Response handling |
|---|---|---|
| **Form POST** | Hidden HTML form submitted to gateway | Gateway redirects browser to `return_path` with result as query params |
| **JSONP** | jQuery AJAX with `jsonpCallback: 'pmntscb'` | Response handled in-page; no navigation |

- **Credentials required:** `username`, `sharedSecret`
- **Form POST hash:** `HMAC-MD5(sharedSecret, "reference:cents:currency:return_path")`
- **JSONP hash:** configurable formula (the harness exposes all variants for testing)
- **Endpoint:** `https://gateway.pmnts-sandbox.io/v2/purchases/direct/{username}[.json]`
- **Harness:** [`/direct-post/harness.html`](https://camcumming.github.io/fatzebra/direct-post/harness.html)
- **Callback:** [`/direct-post/callback.html`](https://camcumming.github.io/fatzebra/direct-post/callback.html)

---

## Credentials

All three harnesses share a single browser cookie (`fz_creds`, path `/fatzebra/`, 8-hour expiry). Enter credentials once via the **Credentials** button in any harness nav bar and they are available across all three harnesses.

```json
{
  "username":     "your-sandbox-username",
  "sharedSecret": "your-sandbox-shared-secret",
  "accessToken":  "your-sandbox-access-token"  // JS SDK only
}
```

`sharedSecret` and `accessToken` are masked in the UI (password inputs with a show/hide toggle). The values stored in the cookie and sent to the gateway are not altered.

---

## Test cards

Use expiry **12/2029** and CVV **123** (4-digit CVV for Amex).

| Network | Card Number | Scenario |
|---|---|---|
| Visa | `4000000000001000` | 3DS2 Frictionless — Successful |
| Mastercard | `5200000000001005` | 3DS2 Frictionless — Successful |
| Amex | `340000000001007` | 3DS2 Frictionless — Successful |
| Visa | `4000000000001026` | 3DS2 Frictionless — Attempts Stand-In |
| Mastercard | `5200000000001021` | 3DS2 Frictionless — Attempts Stand-In |
| Visa | `4000000000001091` | 3DS2 — Challenge Required |
| Mastercard | `5200000000001096` | 3DS2 — Challenge Required |
| Amex | `340000000001098` | 3DS2 — Challenge Required |
| Visa | `4000000000001018` | 3DS2 Frictionless — Failed |
| Visa | `4000000000001042` | 3DS2 Frictionless — Rejected |

Click **View Test Cards** in any harness to copy a card number to the clipboard.

---

## Architecture

- **Static only** — all files are plain HTML, CSS, and JavaScript; no build step, no server-side code
- **GitHub Pages** — deployed directly from the `main` branch root
- **Sandbox** — all endpoints point to `pmnts-sandbox.io` and `gateway.pmnts-sandbox.io`; no production credentials are used
- **HMAC-MD5** — verification hashes are computed in the browser using [crypto-js](https://github.com/brix/crypto-js); this is acceptable for a sandbox harness and is equivalent to what a backend would compute

## Repository structure

```
/
├── index.html                  # Landing page and integration overview
├── v3/
│   ├── harness.html            # V3 Hosted Payment Page harness
│   ├── harness.js
│   ├── harness.css             # Shared base CSS (used by direct-post too)
│   └── callback.html           # Parses and displays V3 return_path params
├── direct-post/
│   ├── harness.html            # Direct Post harness (Form POST + JSONP)
│   ├── harness.js
│   └── callback.html           # Parses and displays Form POST return_path params
└── fatzebra.js/
    ├── harness.html            # JS SDK harness
    ├── harness.js
    ├── harness.css             # Extended from v3/harness.css; adds iframe styles
    └── placeholder.png         # Shown in the iframe container before SDK loads
```

## Local development

No build step needed. Open any `.html` file directly in a browser, or serve the root with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Note: the shared cookie uses `Path=/fatzebra/` which matches the GitHub Pages deployment path. When serving locally from the root (`/`), the cookie path won't match and credentials will need to be re-entered on each harness. Set the path to `/` in `harness.js` if you need cross-harness persistence locally.
