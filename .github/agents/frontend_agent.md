# Hotel Manager — Frontend Architecture & UI Agent

This specification serves as the operational agent guidelines for frontend engineering on the **Hotel Manager Enterprise Property Management System (PMS)**, satisfying the course rubric requirements for **Morehouse College HCSC 460-01 (Group 3)**.

---

## 1. System Identity & Mission
- **Application:** Hotel Manager Client SPA
- **Framework:** React 19 & TypeScript 5.7+
- **Bundler & Tooling:** Vite 6
- **Styling Architecture:** Tailwind CSS v4 with percentage-based responsive layout & CSS flex wrapping
- **Testing Runner:** Vitest 5+ with React Testing Library & jsdom
- **Iconography:** Lucide React

---

## 2. Architectural Boundaries & UI Principles
1. **Frontend-Backend Integration & Network Tokens (Rubric FE Topic 3):**
   - All network communication with the backend is centralized through `frontend/api.ts`.
   - On successful login (`/auth/login`), the session and JWT token are stored in `localStorage`.
   - Every protected API request automatically transmits the authorization token via `Authorization: Bearer <token>`.
2. **Role-Based Workflows & Usability (Rubric FE Topic 4 & 5):**
   - The application strictly segments UI consoles based on authenticated user roles:
     - `ADMIN`: Property directory with 5-item-per-page pagination, staff management modal, room inventory setup.
     - `FRONT_DESK`: Live room status grid (`available`, `OCCUPIED`, `Maintenance`), 1-click check-in/out turnover.
     - `PROPERTY_MANAGER`: Real-time occupancy rate metrics, in-app electricity submeter telemetry logging modal.
     - `MAINTENANCE_ENGINEER`: Facilities work order backlog, equipment diagnostics, 1-click repair sign-off.
     - `GUEST`: Dedicated reservation portal, multi-hotel room search, booking confirmation codes (`HM-XXXXXX`), and cancellation.
3. **No Long Screens Standard (Rubric Usability -5pt Penalty Avoidance):**
   - The UI strictly avoids vertically sprawling pages.
   - Long tabular data is paginated (5 items per page in `AdminView.tsx`).
   - Complex workflows are housed in centered, accessible modals (`CreateHotelModal`, `ManagePropertyModal`, `EditUserModal`, `LogMeterModal`, `GuestBookingModal`).
   - Multi-stage guest flows are separated into tabs ("Browse Available Stays" and "My Reservations").
4. **Fluid Percentage Sizing & Flex Wrapping:**
   - Container widths scale responsively using percentage dimensions (`w-[94%] sm:w-[92%] lg:w-[88%]`).
   - Action buttons maintain fixed visual geometry while flexing across narrow viewports (`flex flex-wrap gap-2.5`).
5. **Safe Frontend Practices & Input Validation:**
   - Numerical validations (nightly pricing decimal constraints, floor integers, telephone formatting) are executed before network submission.
   - API error messages are caught in structured try-catch blocks and rendered cleanly to the user.

---

## 3. Verification & Testing Protocols
- Run component-level unit tests: `npm test` (Vitest executes all `frontend/__tests__/*.test.tsx`).
- Production TypeScript build verification: `npm run build` (`tsc && vite build` must compile with zero errors).
- Local dev server launch: `npm run dev` (serves SPA on `http://localhost:3000`).
