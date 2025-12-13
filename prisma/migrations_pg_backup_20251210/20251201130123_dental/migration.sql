-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "read" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "hero_sliders" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "button_text" TEXT,
    "button_link" TEXT,
    "image" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_sliders_pkey" PRIMARY KEY ("id")
);
