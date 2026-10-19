/**
 * Portal routing contract for NeuroCare APEX.
 *
 * Authentication answers "Who are you?"
 * Portal selection answers "In which authorised context are you working?"
 * Authorisation answers "What can you do to this resource?"
 *
 * A user may have multiple legitimate personas (e.g. Patient + Clinician).
 * Portal selection must be explicit — never silently granted based on role alone.
 */

export type Persona = "patient" | "clinician" | "admin";

export type PersonaProfile = {
  persona: Persona;
  profileId: string;
  active: boolean;
};

/**
 * Result of resolving which portal(s) a user may access.
 */
export type PortalResolution = {
  available: Persona[];        // All portals the user is authorised to enter
  default: Persona | null;     // Suggested default portal (or null if user must choose)
  recommended: Persona | null; // Recommended portal based on context (e.g. last used)
};

/**
 * Resolves the set of portals a user may access based on identity and memberships.
 * Backend permissions remain authoritative — this is a client-side routing aid only.
 *
 * Never silently grants access to a portal merely because another profile exists.
 * If multiple personas exist, the caller should present an explicit persona selector.
 */
export function resolvePortalForUser(
  userId: string,
  roles: string[],
  personas: PersonaProfile[],
  context?: { lastUsedPortal?: Persona },
): PortalResolution {
  const available: Persona[] = [];

  // Map roles to portals
  const roleToPortal: Record<string, Persona[]> = {
    PATIENT: ["patient"],
    PSYCHIATRIST: ["clinician"],
    PRESCRIBER: ["clinician"],
    NURSE: ["clinician"],
    ADMIN: ["admin"],
    FINANCE: ["admin"],
  };

  for (const role of roles) {
    const portals = roleToPortal[role];
    if (portals) {
      for (const p of portals) {
        if (!available.includes(p)) available.push(p);
      }
    }
  }

  // Cross-reference with actual persona profiles
  const activePersonas = personas.filter((p) => p.active);
  const availableFromProfiles = activePersonas.map((p) => p.persona);

  // Intersection: user must have both the role AND an active persona profile
  const finalAvailable = available.filter((p) => availableFromProfiles.includes(p));

  // Determine default: prefer last used, then patient, then first available
  let defaultPortal: Persona | null = null;
  if (context?.lastUsedPortal && finalAvailable.includes(context.lastUsedPortal)) {
    defaultPortal = context.lastUsedPortal;
  } else if (finalAvailable.includes("patient")) {
    defaultPortal = "patient";
  } else if (finalAvailable.length > 0) {
    defaultPortal = finalAvailable[0];
  }

  // Recommended: same as default when only one option; null when user must choose
  const recommended = finalAvailable.length === 1 ? finalAvailable[0] : null;

  return {
    available: finalAvailable,
    default: defaultPortal,
    recommended: finalAvailable.length > 1 ? null : recommended,
  };
}

/**
 * Determines whether a user may access a specific portal.
 */
export function canAccessPortal(
  roles: string[],
  personas: PersonaProfile[],
  portal: Persona,
): boolean {
  const roleToPortal: Record<string, Persona[]> = {
    PATIENT: ["patient"],
    PSYCHIATRIST: ["clinician"],
    PRESCRIBER: ["clinician"],
    NURSE: ["clinician"],
    ADMIN: ["admin"],
    FINANCE: ["admin"],
  };

  const hasRole = roles.some(
    (r) => roleToPortal[r]?.includes(portal),
  );
  const hasProfile = personas.some(
    (p) => p.persona === portal && p.active,
  );

  return hasRole && hasProfile;
}
