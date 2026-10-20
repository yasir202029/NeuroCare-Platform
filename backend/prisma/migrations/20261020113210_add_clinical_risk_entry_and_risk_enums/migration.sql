-- CreateEnum
CREATE TYPE "RiskDomain" AS ENUM ('SELF_HARM', 'SUICIDE', 'RISK_TO_OTHERS', 'VULNERABILITY', 'SAFEGUARDING', 'EXPLOITATION', 'SUBSTANCE_USE', 'DOMESTIC_ABUSE');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskReviewStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'ACTIONED');

-- CreateTable
CREATE TABLE "ClinicalRiskEntry" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "clinicianId" TEXT,
    "domain" "RiskDomain" NOT NULL,
    "currentRisk" "RiskLevel" NOT NULL,
    "historicalRisk" "RiskLevel",
    "protectiveFactors" TEXT,
    "actions" TEXT,
    "notes" TEXT,
    "reviewStatus" "RiskReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalRiskEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClinicalRiskEntry_patientId_createdAt_idx" ON "ClinicalRiskEntry"("patientId", "createdAt");

-- CreateIndex
CREATE INDEX "ClinicalRiskEntry_domain_currentRisk_idx" ON "ClinicalRiskEntry"("domain", "currentRisk");

-- CreateIndex
CREATE INDEX "ClinicalRiskEntry_patientId_updatedAt_idx" ON "ClinicalRiskEntry"("patientId", "updatedAt");

-- AddForeignKey
ALTER TABLE "ClinicalRiskEntry" ADD CONSTRAINT "ClinicalRiskEntry_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalRiskEntry" ADD CONSTRAINT "ClinicalRiskEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
