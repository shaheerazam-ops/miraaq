/*
  Warnings:

  - Added the required column `userId` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "fee" DECIMAL(10,2),
ADD COLUMN     "gatewayOrderId" TEXT,
ADD COLUMN     "gatewayTransactionId" TEXT,
ADD COLUMN     "netAmount" DECIMAL(10,2),
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "webhookPayload" JSONB,
ADD COLUMN     "webhookReceivedAt" TIMESTAMP(3),
ADD COLUMN     "webhookSignature" TEXT,
ADD COLUMN     "webhookVerified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "currency" SET DEFAULT 'PKR';

-- CreateIndex
CREATE INDEX "payments_gateway_idx" ON "payments"("gateway");
