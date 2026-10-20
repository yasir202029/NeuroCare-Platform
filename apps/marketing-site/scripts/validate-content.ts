/**
 * Validates the public marketing content model against the SEO rules.
 *
 * Runs the Python validator so the same rules are enforced in CI, locally and
 * in the container. Exits non-zero when an error is found.
 *
 * Usage: pnpm --filter @neuroassess/marketing-site run validate:content
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const appDir = path.join(process.cwd(), "app");
const validatorDir = path.resolve(process.cwd(), "../../python-services/content-validator");

type PageDescriptor = {
  path: string;
  title: string;
  description: string;
  faq?: Array<{ question: string; answer: string }>;
};

/** Extracts the declared page descriptors from the TypeScript content model. */
function readContentModel(): PageDescriptor[] {
  const source = readFileSync(path.join(appDir, "content.ts"), "utf8");
  const pages: PageDescriptor[] = [];
  const entryPattern = /\{\s*\n\s*title:\s*"((?:[^"\\]|\\.)*)",[\s\S]*?description:\s*"((?:[^"\\]|\\.)*)",[\s\S]*?path:\s*"([^"]+)",(?:[\s\S]*?faq:\s*\[([\s\S]*?)\],)?\s*\}/g;

  let match: RegExpExecArray | null;
  while ((match = entryPattern.exec(source)) !== null) {
    const [, rawTitle, rawDescription, pagePath, faqBlock] = match;
    const faq: Array<{ question: string; answer: string }> = [];
    const faqPattern = /question:\s*"((?:[^"\\]|\\.)*)",\s*\n\s*answer:\s*\n?\s*"((?:[^"\\]|\\.)*)"/g;
    let faqMatch: RegExpExecArray | null;
    while ((faqMatch = faqPattern.exec(faqBlock)) !== null) {
      faq.push({ question: faqMatch[1], answer: faqMatch[2] });
    }
    pages.push({
      path: pagePath,
      title: rawTitle,
      description: rawDescription,
      faq,
    });
  }
  return pages;
}

/** Lists the public routes that actually have a page implementation. */
function implementedRoutes(): string[] {
  const routes = new Set<string>(["/"]);
  for (const entry of readdirSync(appDir)) {
    const full = path.join(appDir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (!readFileSync(path.join(full, "page.tsx"), "utf8")) continue;
    routes.add(`/${entry}`);
  }
  return [...routes];
}

const pages = readContentModel();
const knownRoutes = implementedRoutes();

const payload = JSON.stringify({ pages, knownRoutes, jsonLd: [] });

const result = execFileSync("python3", ["-c", "import sys,json;from validator import validate_pages;d=json.load(sys.stdin);r=validate_pages(d['pages'],d['knownRoutes']);print(json.dumps(r.as_dict()))"], {
  input: payload,
  cwd: validatorDir,
  encoding: "utf8",
});

const report = JSON.parse(result) as {
  ok: boolean;
  checkedPages: number;
  errorCount: number;
  warningCount: number;
  issues: Array<{ severity: string; rule: string; path: string; detail: string }>;
};

console.log(`content-validator: ${report.checkedPages} pages checked, ${report.errorCount} errors, ${report.warningCount} warnings`);
for (const issue of report.issues) {
  console.log(`  [${issue.severity}] ${issue.rule} ${issue.path} — ${issue.detail}`);
}

if (!report.ok) {
  process.exitCode = 1;
}
