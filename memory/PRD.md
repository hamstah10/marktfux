# Auto-Marktplatz — Product Requirements Document

## Original Problem Statement
MVP Auto-Marktplatz für Händler — eine Web-Plattform für kleine bis mittlere Autohändler, auf der sie Fahrzeuge inserieren, verwalten und öffentlich präsentieren können (ähnlich mobile.de). Käufer suchen ohne Konto und senden Anfragen direkt an die Händler. Admin moderiert Händler und Inserate. KI (GPT-5.2) generiert deutsche Fahrzeugbeschreibungen. Tech-Stack: React + FastAPI + MongoDB + Emergent Object Storage.

## User Choices (Confirmed)
1. Händler-Registrierung: Selbstregistrierung + Admin-Freigabe erforderlich (konfigurierbar via `DEALER_AUTO_APPROVE` in backend/.env)
2. KI-Modell: OpenAI GPT-5.2 via Emergent Universal LLM Key
3. E-Mail-Benachrichtigungen: Nur In-App Speicherung (E-Mail Versand later)
4. Bilder-Upload: Emergent Object Storage
5. Admin-Zugang: Vorkonfigurierter Account (siehe test_credentials.md)

## Architecture
- **Backend**: FastAPI single-file `server.py`, MongoDB (motor), JWT Bearer auth, bcrypt password hashing, idempotent admin seeding on startup.
- **Frontend**: React 19 + react-router-dom v7 + axios + sonner toasts. Tailwind w/ shadcn primitives + "Swiss & High-Contrast" design language (red #E63946 accent, Outfit/Manrope fonts, sharp corners).
- **Storage**: Emergent Object Storage for car images (path-based DB references, served via `/api/files/{path}`).
- **AI**: emergentintegrations LlmChat → openai/gpt-5.2, streaming SSE for the description generator.

## Personas
- **Händler (dealer)**: Registers, awaits approval, manages own listings + inquiries, uses AI for descriptions.
- **Käufer (buyer)**: Anonymous — searches, filters, opens detail page, sends inquiry form.
- **Admin**: Manages dealer approvals + listing moderation, pre-seeded admin account.

## Core Requirements (Static)
- Dealer auth with role-based access (dealer / admin) + pending/approved workflow
- Full vehicle CRUD (title, brand, model, year, price, mileage, fuel, transmission, power_hp, description, location, images)
- Public marketplace with filters (brand, price range, year, mileage, fuel, transmission, location, search) + sorting
- Vehicle detail page with image gallery, specs, dealer card, inquiry form
- Anonymous inquiry submission + dealer inbox + mark-as-read
- AI streaming description generator (GPT-5.2)
- Image upload to Emergent Object Storage
- Admin panel: dealers approval queue, listings moderation, platform stats

## What's Been Implemented (2026-02-09)
- ✅ Backend: 25+ endpoints, all under `/api`, full auth + CRUD + admin + AI streaming + file upload
- ✅ Frontend: 9 pages (Landing, Marketplace, CarDetail, Login, Register, DealerLayout, DealerListings, DealerInquiries, DealerStats, CarForm, AdminPanel)
- ✅ Pre-seeded admin (idempotent), MongoDB indexes
- ✅ E2E tested: 22/22 backend tests, all critical frontend flows passing

## Prioritized Backlog
### P1 (next iteration)
- Replace native `<select>` filters with shadcn Select component (design polish)
- Empty-state placeholder for vehicles without images in tables
- Resend/SendGrid email integration for inquiry notifications
- Saved searches / favorites for buyers (no account → cookie/localStorage based)

### P2
- Dealer profile pages with ratings
- Buyer accounts + saved favorites/watchlist
- Vehicle comparison feature
- WhatsApp inquiries via Twilio
- Multi-language (DE/EN)
- Dealer analytics dashboard (views, leads, conversion)
- Pagination on marketplace + admin tables
- Stripe billing for dealer plans

## Endpoint Reference (high-level)
- Auth: POST `/api/auth/register` `/api/auth/login`, GET `/api/auth/me`
- Public vehicles: GET `/api/vehicles`, `/api/vehicles/featured`, `/api/vehicles/facets`, `/api/vehicles/{id}`
- Dealer: GET/POST/PATCH/DELETE `/api/dealer/vehicles[/{id}]`, GET `/api/dealer/stats`, GET `/api/dealer/inquiries`, PATCH `/api/dealer/inquiries/{id}/read`
- Inquiries: POST `/api/vehicles/{id}/inquiries`
- Files: POST `/api/files/upload`, GET `/api/files/{path:path}`
- AI: POST `/api/ai/describe` (SSE stream)
- Admin: GET `/api/admin/stats|dealers|vehicles`, PATCH `/api/admin/dealers/{id}/status`, PATCH `/api/admin/vehicles/{id}/status`
