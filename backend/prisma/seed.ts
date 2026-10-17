import bcrypt from 'bcryptjs';
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

  // Demo users (idempotent): reset passwords + ensure roles, status, verification
  const demoUsers: Array<{ email: string; firstName: string; lastName: string; roles: Role[] }> = [
    { email: 'admin@neurocare.test', firstName: 'Ava', lastName: 'Admin', roles: [Role.ADMIN] },
    { email: 'psychiatrist@neurocare.test', firstName: 'Priya', lastName: 'Psychiatrist', roles: [Role.PSYCHIATRIST] },
    { email: 'prescriber@neurocare.test', firstName: 'Paul', lastName: 'Prescriber', roles: [Role.PRESCRIBER] },
    { email: 'nurse@neurocare.test', firstName: 'Nina', lastName: 'Nurse', roles: [Role.NURSE] },
    { email: 'finance@neurocare.test', firstName: 'Felix', lastName: 'Finance', roles: [Role.FINANCE] },
    { email: 'patient@neurocare.test', firstName: 'Pat', lastName: 'Patient', roles: [Role.PATIENT] },
  ];
  const passwordHash = await bcrypt.hash('Neurocare123', 12);
  const now = new Date();
  for (const demo of demoUsers) {
    const existing = await prisma.user.findUnique({ where: { email: demo.email } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          roles: demo.roles,
          status: 'ACTIVE',
          emailVerifiedAt: existing.emailVerifiedAt ?? now,
          firstName: demo.firstName,
          lastName: demo.lastName,
        },
      });
      for (const role of demo.roles) {
        await prisma.userRole.upsert({
          where: { userId_role: { userId: existing.id, role } },
          create: { userId: existing.id, role },
          update: {},
        });
      }
    } else {
      const created = await prisma.user.create({
        data: {
          email: demo.email,
          passwordHash,
          firstName: demo.firstName,
          lastName: demo.lastName,
          roles: demo.roles,
          status: 'ACTIVE',
          emailVerifiedAt: now,
          roleAssignments: { create: demo.roles.map((role) => ({ role })) },
        },
      });
      if (demo.roles.includes(Role.PATIENT)) {
        await prisma.patient.upsert({ where: { userId: created.id }, create: { userId: created.id }, update: {} });
      }
    }
  }
  console.log('Seed complete: permissions, teams, demo users (password: Neurocare123)');
}

main().finally(() => prisma.$disconnect());
