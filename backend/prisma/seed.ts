import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
  ['portal.patient', 'Access the patient portal'],
  ['portal.clinician', 'Access clinical workflows'],
  ['portal.admin', 'Access administration'],
  ['portal.finance', 'Access finance and revenue'],
  ['portal.prescriber', 'Access prescription workflows'],
  ['portal.nurse', 'Access nursing workflows'],
  ['finance.read', 'View invoices, payments and revenue'],
  ['finance.write', 'Process refunds and payment plans'],
  ['earnings.read.own', 'View own clinician earnings'],
  ['prescription.sign', 'Sign prescriptions'],
  ['physical-health.write', 'Record physical health'],
  ['audit.read', 'View audit events'],
] as const;

const rolePermissions: Record<Role, string[]> = {
  ADMIN: permissions.map(([code]) => code),
  PSYCHIATRIST: ['portal.clinician', 'portal.prescriber', 'earnings.read.own', 'prescription.sign', 'physical-health.write'],
  PRESCRIBER: ['portal.clinician', 'portal.prescriber', 'earnings.read.own', 'prescription.sign', 'physical-health.write'],
  NURSE: ['portal.clinician', 'portal.nurse', 'earnings.read.own', 'physical-health.write'],
  PATIENT: ['portal.patient'],
  FINANCE: ['portal.finance', 'finance.read', 'finance.write'],
};

const teams = [
  ['assessment', 'Assessment Team', 'ASSESSMENT'],
  ['titration', 'Titration Team', 'TITRATION'],
  ['prescribing', 'Prescribing Team', 'PRESCRIBING'],
  ['nursing', 'Nursing Team', 'NURSING'],
  ['administration', 'Administration Team', 'ADMINISTRATION'],
  ['finance', 'Finance Team', 'FINANCE'],
  ['clinical-governance', 'Clinical Governance Team', 'CLINICAL_GOVERNANCE'],
] as const;

async function main() {
  const records = new Map<string, string>();
  for (const [code, description] of permissions) {
    const permission = await prisma.permission.upsert({ where: { code }, create: { code, description }, update: { description } });
    records.set(code, permission.id);
  }
  for (const [role, codes] of Object.entries(rolePermissions) as [Role, string[]][]) {
    for (const code of codes) await prisma.rolePermission.upsert({ where: { role_permissionId: { role, permissionId: records.get(code)! } }, create: { role, permissionId: records.get(code)! }, update: {} });
  }
  for (const [code, name, type] of teams) await prisma.team.upsert({ where: { code }, create: { code, name, type }, update: { name, type, active: true } });
}

main().finally(() => prisma.$disconnect());
