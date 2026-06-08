/*
  Warnings:

  - You are about to drop the column `gatewayRef` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `sessionRef` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `webhookSignature` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `webhookVerified` on the `payments` table. All the data in the column will be lost.
  - Made the column `fee` on table `payments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `netAmount` on table `payments` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "payments_gateway_idx";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "gatewayRef",
DROP COLUMN "sessionRef",
DROP COLUMN "webhookSignature",
DROP COLUMN "webhookVerified",
ADD COLUMN     "cardBrand" TEXT,
ADD COLUMN     "maskedCard" TEXT,
ALTER COLUMN "fee" SET NOT NULL,
ALTER COLUMN "fee" SET DEFAULT 0,
ALTER COLUMN "fee" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "netAmount" SET NOT NULL,
ALTER COLUMN "netAmount" SET DEFAULT 0,
ALTER COLUMN "netAmount" SET DATA TYPE DECIMAL(65,30);
