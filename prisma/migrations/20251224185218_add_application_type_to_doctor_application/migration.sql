-- AlterTable
ALTER TABLE `doctor_applications` ADD COLUMN `application_type` ENUM('DENTIST', 'NURSE') NOT NULL DEFAULT 'DENTIST';

