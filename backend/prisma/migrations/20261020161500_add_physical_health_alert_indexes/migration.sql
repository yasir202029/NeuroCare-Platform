-- Indexes for the clinician monitoring alert queue.
-- The queue filters on unacknowledged alerts ordered by severity/createdAt and
-- joins from PhysicalHealthAlert to PhysicalHealthReview to reach the patient.
CREATE INDEX "PhysicalHealthAlert_acknowledgedAt_severity_createdAt_idx" ON "PhysicalHealthAlert"("acknowledgedAt", "severity", "createdAt");

CREATE INDEX "PhysicalHealthAlert_reviewId_idx" ON "PhysicalHealthAlert"("reviewId");
