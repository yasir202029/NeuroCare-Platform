import { SITE_URL } from "../content";

/**
 * RFC 9116 security contact file, served from the site root.
 * The contact address is the organisation's published security contact.
 */
export function GET() {
  const body = [
    "Contact: mailto:security@neurocare.example.com",
    "Preferred-Languages: en-GB",
    "Canonical: " + `${SITE_URL}/.well-known/security.txt`,
    "Expires: " + new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
