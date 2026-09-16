# Clinic Content and Admin Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship tenant-scoped gallery and service doctors while repairing clinic branding, mobile navigation, admin contrast, and Vazirmatn consistency.

**Architecture:** PostgreSQL relations own tenant and doctor-service associations; Express derives the public clinic from the hostname; React consumes the enriched resources and renders domain-specific branding. Shared CSS tokens repair the admin system without duplicating page-specific overrides.

**Tech Stack:** PostgreSQL, Prisma 5, Express 4, React 19, TypeScript, Vite 7, Tailwind CSS 4.

**Spec:** `docs/superpowers/specs/2026-09-16-clinic-content-admin-repair-design.md`

## Global Constraints

- Reuse `Clinic.image`; do not add a logo column.
- Move legacy gallery rows to the `tahadental.com` clinic.
- Enforce tenant boundaries in the backend, not only in React.
- Use locally hosted Vazirmatn everywhere.
- Do not alter SSL or certificate configuration.

---

### Task 1: Tenant data relations

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260916160000_add_gallery_clinic_and_doctor_services/migration.sql`
- Create: `src/domain/tenantContent.js`
- Test: `test/tenantContent.test.js`

**Interfaces:**
- Produces: `tenantClinicId(req): string|null` and `serviceDoctorWhere(tenantClinicId): object`.

- [ ] Write Node tests proving unknown tenants return no public content and service doctors intersect clinic membership.
- [ ] Run `node --test test/tenantContent.test.js` and confirm failure because the module is absent.
- [ ] Add Prisma relations, migration SQL, and minimal helper implementation.
- [ ] Re-run the test and `npx prisma validate`.
- [ ] Commit the backend data-model change.

### Task 2: Gallery tenant enforcement

**Files:**
- Modify: `src/controllers/galleryController.js`
- Modify: `src/routes/galleryRoutes.js`
- Modify: `src/middlewares/clinicTenant.js`
- Test: `test/tenantContent.test.js`

**Interfaces:**
- Consumes: `tenantClinicId(req)`.
- Produces: gallery API records containing `clinicId` and `clinic`.

- [ ] Add failing tests for domain-bound clinic selection and override rejection.
- [ ] Run the focused tests and confirm the expected assertions fail.
- [ ] Apply tenant filters to list/detail/create/update/delete paths and validate `clinicId`.
- [ ] Re-run focused tests and Prisma validation.
- [ ] Commit gallery isolation.

### Task 3: Doctor service assignments

**Files:**
- Modify: `src/controllers/doctorController.js`
- Modify: `src/controllers/serviceController.js`
- Modify: `src/routes/doctorRoutes.js`
- Test: `test/tenantContent.test.js`

**Interfaces:**
- Consumes: `serviceIds: string[]` and `serviceDoctorWhere(clinicId)`.
- Produces: doctor payload `services[]`; service payload `doctors[]`.

- [ ] Add failing tests for service assignment normalization and tenant intersection.
- [ ] Run focused tests and confirm the behavior is absent.
- [ ] Persist join rows transactionally and include relations in reads.
- [ ] Re-run tests and Prisma validation.
- [ ] Commit doctor-service API support.

### Task 4: Clinic branding and public UI

**Files:**
- Modify: `frontend/src/components/modules/Main/Navbar/Navbar.tsx`
- Modify: `frontend/src/components/modules/Main/Navbar/MobileMenu.tsx`
- Modify: `frontend/src/components/modules/Main/Footer/Footer.tsx`
- Modify: `frontend/src/pages/Main/ServiceDetails/ServiceDetails.tsx`
- Modify: `frontend/src/types/types.ts`

**Interfaces:**
- Consumes: current clinic context, `Clinic.image`, and `service.doctors`.
- Produces: tenant-branded navigation and a service-doctor section.

- [ ] Add pure selector tests for clinic branding and assigned-doctor display.
- [ ] Confirm tests fail against current selectors.
- [ ] Implement selectors, responsive drawer, footer/SEO branding, and doctor cards.
- [ ] Run tests and `npm run build`.
- [ ] Commit public UI changes.

### Task 5: Admin gallery and doctor forms

**Files:**
- Modify: `frontend/src/services/useGallery.ts`
- Modify: `frontend/src/services/useDoctors.ts`
- Modify: `frontend/src/components/templates/AdminDashboard/GalleryManagement/GalleryManagementForm/GalleryManagementForm.tsx`
- Modify: `frontend/src/components/templates/AdminDashboard/GalleryManagement/GalleryManagementTable/GalleryManagementTable.tsx`
- Modify: `frontend/src/components/templates/AdminDashboard/DoctorsManagement/DoctorManagementForm/DoctorManagementForm.tsx`

**Interfaces:**
- Consumes: `clinicId` and `serviceIds` form values.
- Produces: valid multipart payloads and visible assignment columns.

- [ ] Add validation/serialization tests for required clinic and service ID arrays.
- [ ] Confirm the tests fail before implementation.
- [ ] Add clinic/service controls and query invalidation.
- [ ] Run tests, lint, and build.
- [ ] Commit management UI changes.

### Task 6: Admin contrast and Vazirmatn audit

**Files:**
- Modify: `frontend/src/styles/fonts.css`
- Modify: `frontend/src/styles/global.css`
- Modify: `frontend/src/components/modules/AdminDashboard/TextEditor/TextEditor.css`
- Modify: representative admin header, sidebar, dashboard, table, form, and modal components as identified by the visual audit.

**Interfaces:**
- Produces: semantic admin CSS classes and compatibility font aliases.

- [ ] Add a static audit test rejecting non-Vazirmatn legacy declarations and unsafe light-gradient/white-text combinations.
- [ ] Run the audit and capture the current failures.
- [ ] Implement semantic tokens, compatibility aliases, and component corrections.
- [ ] Run audit, lint, build, and responsive browser checks.
- [ ] Commit visual-system repairs.

### Task 7: Release and deployment

**Files:**
- Modify: backend `dist/` with the new frontend production build.

**Interfaces:**
- Consumes: verified frontend build and backend migrations.
- Produces: deployable backend repository.

- [ ] Run backend tests, Prisma validation/generation, frontend lint, and frontend build.
- [ ] Replace backend `dist/` with the build artifact and verify hashes/counts.
- [ ] Commit and push frontend, then commit and push backend.
- [ ] Pull on cPanel, deploy the migration, restart the Node application, and leave SSL untouched.
- [ ] Verify both domains, mobile navigation, tenant gallery, service doctors, admin contrast, and loaded Vazirmatn in the real browser.
