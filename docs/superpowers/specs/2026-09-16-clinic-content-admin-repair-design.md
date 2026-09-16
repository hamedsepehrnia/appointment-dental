# Clinic Content, Doctor Services, and UI Repair Design

## Scope

Deliver a tenant-aware gallery, doctor-to-service assignments, clinic-specific branding from the existing `Clinic.image`, a usable mobile navigation drawer, complete Vazirmatn typography, and a contrast-safe admin interface. SSL and certificate operations are explicitly out of scope.

## Data model

- `Gallery.clinicId` becomes a required foreign key to `Clinic` with cascade delete and an index.
- The migration assigns every existing gallery row to the clinic whose domain is `tahadental.com`; it aborts if that clinic cannot be found rather than guessing.
- `DoctorService` is a normalized many-to-many join with unique `(doctorId, serviceId)` and cascade deletes.
- `Clinic.image` remains the single clinic logo/image field. No new logo field is introduced.

## Tenant behavior

- Public gallery reads are constrained to `req.tenantClinic` when a recognized custom domain is used.
- Public service detail includes assigned doctors intersected with membership in the current tenant clinic.
- Admin gallery create/update accepts a clinic selection for administrators; tenant-bound staff cannot override their clinic.
- Unknown domains do not silently expose another clinic's gallery or doctors.

## Frontend behavior

- Navbar, mobile menu, footer, and SEO prefer `selectedClinic.image` and `selectedClinic.name`, falling back to global settings only when no clinic branding exists.
- Mobile navigation is a full-height RTL drawer with an overlay, internal scrolling, 44px minimum targets, clear active states, and body-scroll locking.
- Doctor management provides a multi-select for services and submits `serviceIds`.
- Service details render an accessible doctor section below the service content, scoped by the current domain.
- Gallery management requires/selects a clinic; the public gallery query is hostname-aware through the existing API client.

## Admin visual system

- Admin surfaces use semantic tokens for canvas, surfaces, borders, primary text, muted text, brand actions, and destructive actions.
- Legacy purple/white combinations are replaced or safely remapped; white text is only used on verified dark fills.
- Header, sidebar, welcome banner, cards, tables, forms, select menus, editors, modals, pagination, empty states, focus, hover, disabled, and mobile states are reviewed.
- All text controls inherit Vazirmatn.

## Typography

- Locally hosted Vazirmatn remains the only UI typeface.
- Legacy font utility classes (`font-estedad-*`, `font-iran-*`) are retained as compatibility aliases but resolve to Vazirmatn.
- Inputs, buttons, selects, textareas, dialogs, CKEditor content, and third-party select controls inherit the same family.

## Verification

- Automated tests cover hostname normalization and tenant filter helpers, gallery clinic assignment, and doctor/service filtering.
- Prisma validates and generates successfully; migrations are syntactically valid.
- Frontend TypeScript build and lint run successfully.
- Browser checks cover public desktop/mobile pages, the drawer, gallery isolation, service doctors, and representative admin pages at desktop/mobile widths.
- Deployment verification is performed against both `tahadental.com` and `baghiyatallah.com`; certificate status is not changed or claimed.
