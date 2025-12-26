-- AlterTable
ALTER TABLE `appointments` ADD COLUMN `eitaa_message_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `clinics` ADD COLUMN `eitaa_chat_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `site_settings` ADD COLUMN `eitaa_api_token` VARCHAR(191) NULL,
    ADD COLUMN `secretary_notification_method` VARCHAR(191) NOT NULL DEFAULT 'SMS';
