-- Gallery ownership is required. Existing rows belong to the Taha clinic.
ALTER TABLE "gallery" ADD COLUMN "clinic_id" TEXT;

DO $$
DECLARE
  taha_clinic_id TEXT;
BEGIN
  SELECT "id" INTO taha_clinic_id
  FROM "clinics"
  WHERE lower("domain") = 'tahadental.com'
  LIMIT 1;

  IF taha_clinic_id IS NULL THEN
    RAISE EXCEPTION 'Cannot migrate gallery: clinic with domain tahadental.com was not found';
  END IF;

  UPDATE "gallery" SET "clinic_id" = taha_clinic_id WHERE "clinic_id" IS NULL;
END $$;

ALTER TABLE "gallery" ALTER COLUMN "clinic_id" SET NOT NULL;
CREATE INDEX "gallery_clinic_id_idx" ON "gallery"("clinic_id");
ALTER TABLE "gallery"
  ADD CONSTRAINT "gallery_clinic_id_fkey"
  FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "doctor_services" (
  "id" TEXT NOT NULL,
  "doctor_id" TEXT NOT NULL,
  "service_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "doctor_services_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "doctor_services_doctor_id_service_id_key"
  ON "doctor_services"("doctor_id", "service_id");
CREATE INDEX "doctor_services_service_id_idx" ON "doctor_services"("service_id");
ALTER TABLE "doctor_services"
  ADD CONSTRAINT "doctor_services_doctor_id_fkey"
  FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doctor_services"
  ADD CONSTRAINT "doctor_services_service_id_fkey"
  FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
