type SupabaseAuthResult = { ok: true } | { ok: false; message: string };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function requestMagicLink(email: string): Promise<SupabaseAuthResult> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { ok: true };
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/otp`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, create_user: true }),
  });

  if (response.ok) {
    return { ok: true };
  }

  const payload = (await response.json().catch(() => null)) as
    | { msg?: string; message?: string; error_description?: string }
    | null;
  return {
    ok: false,
    message:
      payload?.msg ??
      payload?.message ??
      payload?.error_description ??
      "We could not send the sign-in link. Please try again.",
  };
}