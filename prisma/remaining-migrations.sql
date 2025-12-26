-- AlterTable
ALTER TABLE `clinics` ADD COLUMN `image` VARCHAR(191) NULL,
    ADD COLUMN `working_hours` JSON NULL;

-- AlterTable
ALTER TABLE `site_settings` ADD COLUMN `appointment_mode` VARCHAR(191) NOT NULL DEFAULT 'SIMPLE',
    ADD COLUMN `max_appointments_per_hour` INTEGER NOT NULL DEFAULT 10,
    ADD COLUMN `sync_api_key` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `appointments` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NULL,
    `patient_name` VARCHAR(191) NULL,
    `national_code` VARCHAR(191) NULL,
    `patient_phone` VARCHAR(191) NULL,
    `clinic_id` VARCHAR(191) NOT NULL,
    `doctor_id` VARCHAR(191) NULL,
    `appointment_date` DATETIME(3) NOT NULL,
    `duration_minutes` INTEGER NOT NULL DEFAULT 10,
    `type` ENUM('CONSULTATION', 'OPERATION') NOT NULL DEFAULT 'CONSULTATION',
    `status` ENUM('APPROVED_BY_USER', 'CANCELED', 'FINAL_APPROVED') NOT NULL DEFAULT 'APPROVED_BY_USER',
    `reminder_24h_sent` BOOLEAN NOT NULL DEFAULT false,
    `reminder_30m_sent` BOOLEAN NOT NULL DEFAULT false,
    `external_id` VARCHAR(191) NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'WEBSITE',
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `appointments_external_id_key`(`external_id`),
    INDEX `appointments_user_id_idx`(`user_id`),
    INDEX `appointments_clinic_id_idx`(`clinic_id`),
    INDEX `appointments_doctor_id_idx`(`doctor_id`),
    INDEX `appointments_appointment_date_idx`(`appointment_date`),
    INDEX `appointments_status_idx`(`status`),
    INDEX `appointments_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `link` VARCHAR(191) NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `appointment_id` VARCHAR(191) NULL,
    `clinic_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_clinic_id_idx`(`clinic_id`),
    INDEX `notifications_read_idx`(`read`),
    INDEX `notifications_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_clinic_id_fkey` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_clinic_id_fkey` FOREIGN KEY (`clinic_id`) REFERENCES `clinics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
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
-- AlterTable
ALTER TABLE `appointments` ADD COLUMN `eitaa_message_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `clinics` ADD COLUMN `eitaa_chat_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `site_settings` ADD COLUMN `eitaa_api_token` VARCHAR(191) NULL,
    ADD COLUMN `secretary_notification_method` VARCHAR(191) NOT NULL DEFAULT 'SMS';
-- AlterTable
ALTER TABLE `doctors` ADD COLUMN `is_appointment_enabled` BOOLEAN NOT NULL DEFAULT false;
-- AlterTable
ALTER TABLE `site_settings` ADD COLUMN `eitaa` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `doctor_applications` ADD COLUMN `application_type` ENUM('DENTIST', 'NURSE') NOT NULL DEFAULT 'DENTIST';

-- AlterTable
ALTER TABLE `site_settings` ADD COLUMN `become_nurse_content` TEXT NULL;

