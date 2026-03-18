# TestMart

A full-stack web application with a React frontend and Node.js backend, featuring role-based user authentication, product management, shopping cart, and user administration.

---

## Tech Stack

- **Frontend:** React, Material-UI (MUI), React Router
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Auth:** JWT (access + refresh tokens), bcryptjs
- **Testing:** Playwright (API + end-to-end)
- **CI/CD:** GitHub Actions

---

## Features

### Security & Authentication
- JWT-based login with short-lived access tokens and long-lived refresh tokens
- `bcryptjs` password hashing
- Role-based access control with middleware enforcement (`superadmin`, `merchant`, `customer`)
- Account lockout after 3 failed login attempts (5-minute lock)
- HTTP header protection via `Helmet`
- XSS prevention via `xss-clean`
- NoSQL injection prevention with `express-mongo-sanitize`
- Rate limiting to guard against brute-force attacks

### Role-Based Access

#### Super Admin (`superadmin`)
- Access to all pages and features
- View all products
- Add new products
- Manage all user accounts (update name, email, role, block/unblock)

#### Merchant (`merchant`)
- View all products
- Add new products (name, description, image, price, rating)
- Edit existing products
- Access merchant dashboard with store stats and top products

#### Customer (`customer`)
- Browse all products
- Add products to cart
- View and manage cart (adjust quantities, remove items)
- View order summary with subtotal, tax, and total
- Secure checkout with Stripe Sandbox payment integration
- Place orders after successful payment
- Access customer dashboard with order history and wishlist overview

#### Payment Integration
- Integrated Stripe Sandbox for secure test payments
- Customers can complete checkout using Stripe's payment flow
- Payment confirmation before order creation
- Simulated real-world e-commerce payment processing
- Supports testing with Stripe test cards
- Designed to enable automated payment flow testing

### Frontend & UI
- Role-specific dashboards rendered automatically on login
- Smart navbar with role badge and context-aware links
- Cart icon with live item count badge (customers only)
- Fully responsive UI built with Material-UI (MUI)
- Protected routes — unauthorized roles are redirected automatically

### DevOps & Quality Assurance
- API test suite and end-to-end test suite powered by Playwright
- Page Object Model (POM) architecture for maintainable E2E tests
- CI/CD pipeline via GitHub Actions for automated testing and deployment

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- [MongoDB](https://www.mongodb.com/try/download/community) (local) or a [MongoDB Atlas](https://www.mongodb.com/atlas) cloud URI
- [Git](https://git-scm.com/)

---

### 1. Clone the Repository

```bash
git clone https://github.com/tfariyah31/TestMart-ReactNode_Playwright_CI.git
cd TestMart
```

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/mywebapp
JWT_SECRET=your_secret_key_here
REFRESH_SECRET=your_refresh_secret
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

> Replace `MONGO_URI` with your MongoDB Atlas connection string if using a cloud database.

Start the backend server:

```bash
node server.js
```

The backend will be available at `http://localhost:5001`.

### 3. Set Up the Frontend

```bash
cd ../frontend
npm install --legacy-peer-deps
```

Create a `.env` file in the `frontend` folder:

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

Start the frontend:

```bash
npm start
```

The frontend will be available at `http://localhost:3000`.

---

## Project Structure

```
TestMart/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── utils/
│   ├── App.js
│   └── .env
├── tests/
│   ├── api/                        ← API contract tests
│   │   ├── auth.api.spec.ts
│   │   ├── products.api.spec.ts
│   │   ├── users.api.spec.ts
│   │   └── payments.api.spec.ts
│   ├── e2e/                        ← End-to-end UI tests
│   │   ├── auth/
│   │   │   └── login.spec.ts
│   │   └── customer/
│   │       └── customer-journey.spec.ts
│   ├── fixtures/
│   │   ├── auth.fixture.ts
│   │   ├── page.fixture.ts         ← POM fixture wiring
│   │   └── test-data.ts
│   ├── pages/                      ← Page Object Models
│   │   ├── LoginPage.ts
│   │   ├── DashboardPage.ts
│   │   ├── ProductsPage.ts
│   │   ├── CartPage.ts
│   │   └── CheckoutPage.ts
│   └── global.setup.ts
├── package.json
├── playwright.config.ts
└── README.md
```

---

## API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/login` | Public | Login and receive JWT tokens |
| POST | `/register` | Public | Register a new customer account |
| POST | `/refresh` | Public | Refresh access token |
| POST | `/logout` | Authenticated | Logout and invalidate refresh token |

### Products — `/api/products`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | All roles | Get all products |
| GET | `/:id` | All roles | Get single product |
| POST | `/` | Merchant, Super Admin | Add a new product |
| PUT | `/:id` | Merchant, Super Admin | Update a product |
| DELETE | `/:id` | Merchant, Super Admin | Delete a product |

### Users — `/api/users`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Super Admin | Get all users |
| GET | `/:id` | Super Admin | Get single user |
| PUT | `/:id` | Super Admin | Update user info, role, or block status |

---

## Playwright Tests

### Prerequisites

- Backend running at `http://127.0.0.1:5001`
- Frontend running at `http://localhost:3000`
- Test users seeded in MongoDB — run `npm run seed:test` from the backend directory

### Running the Tests

Global setup (`tests/global.setup.ts`) runs automatically before the tests. It logs in as each role (`superadmin`, `merchant`, `customer`) and saves session tokens to `.sessions/` for reuse across all tests.

```bash
# API tests only
npm run test:api

# E2E customer journey only
npm run test:journey

# All E2E tests
npm run test:e2e

# Open HTML report
npm run test:report
```

---

## API Test Coverage

| Spec file | Endpoints covered |
|-----------|------------------|
| `auth.api.spec.ts` | `POST /api/auth/login`, `/register`, `/refresh`, `/logout` |
| `users.api.spec.ts` | `GET /api/users`, `GET /api/users/:id`, `PUT /api/users/:id` |
| `products.api.spec.ts` | `GET /api/products`, `GET /api/products/:id`, `POST`, `PUT`, `DELETE` |
| `payments.api.spec.ts` | `POST /api/payments/create-intent` |

---

## E2E Test Coverage

### Customer Journey (`tests/e2e/customer/customer-journey.spec.ts`)

A single end-to-end test covering the full customer purchase flow using the Page Object Model pattern. Each step is a named `test.step()` block — the HTML report shows per-step pass/fail and a single trace file covers the entire journey.

| Step | What is tested |
|------|---------------|
| Login | Customer logs in via the login form → redirected to `/dashboard`, `accessToken` and `userRole` written to `localStorage` |
| Dashboard | Customer dashboard renders with welcome heading, stats, and quick action buttons |
| Browse products | Navigates to `/products` via "Shop Now" button, product catalogue loads with at least one item |
| Add to cart | Adds the first product, confirms snackbar notification, navigates to cart via Navbar |
| Review cart | Cart item is present, order total is a valid dollar amount, Stripe payment form is rendered |
| Checkout | Fills Stripe test card `4242 4242 4242 4242`, submits payment, confirms success message and order-placed snackbar, verifies redirect to `/products` and cart cleared from `localStorage` |

**Test card used:** `4242 4242 4242 4242` — expiry `12/26`, CVC `424` (Stripe test mode, no real charge)

### Login Tests (`tests/e2e/auth/login.spec.ts`)

| ID | Scenario |
|----|----------|
| LGN-E2E-001 | Customer logs in and lands on `/dashboard` |
| LGN-E2E-002 | Merchant logs in and lands on `/dashboard` |
| LGN-E2E-003 | Super Admin logs in and lands on `/dashboard` |
| LGN-E2E-004 | Wrong password shows inline error, stays on login page |
| LGN-E2E-005 | Non-existent email shows inline error |
| LGN-E2E-006 | Blocked user sees blocked-account error message |
| LGN-E2E-007 | Empty form submit fires no network request |
| LGN-E2E-008 | Locked-out user sees disabled "Try again later" button |
| LGN-E2E-009 | Successful login writes `accessToken` and `userRole` to `localStorage` |
| LGN-E2E-010 | Pre-authenticated user visiting `/` is redirected to `/dashboard` |

---

## Page Object Models

All E2E interactions are encapsulated in POM classes under `tests/pages/`. Tests never access `page` directly for UI interactions — they call POM methods instead, keeping selectors and interaction logic in one place.

| POM | Route | Responsibility |
|-----|-------|---------------|
| `LoginPage` | `/` | `goto()`, `login()`, `expectRedirectedToDashboard()`, `expectErrorVisible()` |
| `DashboardPage` | `/dashboard` | `expectLoaded()`, `expectWelcomeHeading()`, `clickShopNow()` |
| `ProductsPage` | `/products` | `waitForProducts()`, `addFirstProductToCart()`, `goToCartViaNavbar()` |
| `CartPage` | `/cart` | `expectItemInCart()`, `getTotal()`, `expectPaymentFormVisible()` |
| `CheckoutPage` | `/cart` | `fillStripeCard()`, `placeOrder()`, `expectPaymentSuccess()` |

---

## Notes

- API tests are **read-only safe** — any products created during testing are cleaned up via `afterAll`
- Blocked/locked user credentials are available via `getCredentials('blockedUser')` in `fixtures/auth.fixture.ts`
- The E2E customer journey test starts from the login form (no `storageState`) to validate the full flow
- Stripe Link is blocked at the DNS level in Playwright config to prevent authentication popups in headless runs

---

## Author

**Tasnim Fariyah**

[![GitHub](https://img.shields.io/badge/GitHub-tfariyah31-181717?logo=github)](https://github.com/tfariyah31)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-tasnim--fariyah-0A66C2?logo=linkedin)](https://www.linkedin.com/in/tasnim-fariyah/)
