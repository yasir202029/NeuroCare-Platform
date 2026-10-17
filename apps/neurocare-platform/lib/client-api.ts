export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const request = () => fetch(input, { ...init, credentials: "include" });
  let response = await request();
  if (response.status !== 401) return response;

  const refreshed = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });
  if (!refreshed.ok) return response;
  response = await request();
  return response;
}
