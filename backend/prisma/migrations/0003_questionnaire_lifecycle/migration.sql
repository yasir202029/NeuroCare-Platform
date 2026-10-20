-- CreateEnum
CREATE TYPE "ClinicalFormSubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVIEWED');

-- AlterEnum
ALTER TYPE "TaskType" ADD VALUE 'QUESTIONNAIRE_REVIEW';

-- AlterTable
ALTER TABLE "ClinicalFormSubmission" ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "status" "ClinicalFormSubmissionStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ClinicalTask" ADD COLUMN     "questionnaireSubmissionId" TEXT;

-- CreateIndex
CREATE INDEX "ClinicalFormSubmission_status_submittedAt_idx" ON "ClinicalFormSubmission"("status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalTask_questionnaireSubmissionId_key" ON "ClinicalTask"("questionnaireSubmissionId");

-- AddForeignKey
ALTER TABLE "ClinicalTask" ADD CONSTRAINT "ClinicalTask_questionnaireSubmissionId_fkey" FOREIGN KEY ("questionnaireSubmissionId") REFERENCES "ClinicalFormSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalFormSubmission" ADD CONSTRAINT "ClinicalFormSubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

