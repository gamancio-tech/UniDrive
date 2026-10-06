-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "deletedForEveryoneAt" TIMESTAMP(3),
ADD COLUMN     "hiddenForDriver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hiddenForStudent" BOOLEAN NOT NULL DEFAULT false;
