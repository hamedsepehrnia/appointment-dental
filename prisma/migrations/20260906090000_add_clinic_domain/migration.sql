ALTER TABLE "clinics" ADD COLUMN "domain" TEXT;
CREATE UNIQUE INDEX "clinics_domain_key" ON "clinics"("domain");
