-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "parent_id" TEXT;

-- AlterTable
ALTER TABLE "doctors" ADD COLUMN     "short_description" TEXT;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
