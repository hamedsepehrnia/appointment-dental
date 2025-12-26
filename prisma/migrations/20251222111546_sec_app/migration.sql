/*
  Warnings:

  - You are about to drop the column `sync_api_key` on the `site_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `site_settings` DROP COLUMN `sync_api_key`;

-- CreateTable
CREATE TABLE `sync_api_keys` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `api_key` VARCHAR(191) NOT NULL,
    `clinic_id` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_used_at` DATETIME(3) NULL,
    `site_settings_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sync_api_keys_api_key_key`(`api_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sync_api_keys` ADD CONSTRAINT `sync_api_keys_clinic_id_fkey` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sync_api_keys` ADD CONSTRAINT `sync_api_keys_site_settings_id_fkey` FOREIGN KEY (`site_settings_id`) REFERENCES `site_settings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
