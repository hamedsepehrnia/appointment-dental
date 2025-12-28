-- Convert phone_number from TEXT to JSONB array
-- First, convert existing single phone numbers to arrays
UPDATE "clinics" 
SET "phone_number" = jsonb_build_array("phone_number")
WHERE "phone_number" IS NOT NULL AND "phone_number" != '';

-- Convert empty strings to empty arrays
UPDATE "clinics" 
SET "phone_number" = '[]'::jsonb
WHERE "phone_number" = '' OR "phone_number" IS NULL;

-- Alter the column type from TEXT to JSONB
ALTER TABLE "clinics" 
ALTER COLUMN "phone_number" TYPE JSONB USING "phone_number"::jsonb;

-- Set default value to empty array
ALTER TABLE "clinics" 
ALTER COLUMN "phone_number" SET DEFAULT '[]'::jsonb;

