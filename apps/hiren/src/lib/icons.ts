// Inline brand logos at build time from the Iconify "logos" set (offline, no
// external requests). Plus a few hand-drawn "representative" icons for the
// concepts that have no brand logo (REST API, Agents, CI/CD).
import logos from "@iconify-json/logos/icons.json";

type IconData = { body: string; width?: number; height?: number };
type IconSet = { icons: Record<string, IconData>; width?: number; height?: number };
const set = logos as unknown as IconSet;

/** Returns an inline <svg> string for a full-colour brand logo, or null. */
export function brandLogo(name: string): string | null {
  const ic = set.icons[name];
  if (!ic) return null;
  const w = ic.width ?? set.width ?? 256;
  const h = ic.height ?? set.height ?? 256;
  return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${ic.body}</svg>`;
}

/** Representative icons (monochrome, inherit currentColor). */
const rep: Record<string, string> = {
  restapi: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 7 3 12l5 5M16 7l5 5-5 5"/><path d="M13.5 5l-3 14"/></svg>`,
  agents: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 8V4M12 4a1.6 1.6 0 1 0 0-.01"/><path d="M2 13v3M22 13v3"/><circle cx="9" cy="13.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15" cy="13.5" r="1.2" fill="currentColor" stroke="none"/></svg>`,
  cicd: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/><circle cx="12" cy="12" r="2.3" fill="currentColor" stroke="none"/></svg>`,
};

export type ToolIcon = { label: string; svg: string; brand: boolean };

// Order is the marquee order. Brand logos where they exist; representative
// icons for REST API / Agents / CI/CD.
const toolMap: { label: string; slug?: string; repKey?: string }[] = [
  { label: "TypeScript", slug: "typescript-icon" },
  { label: "Python", slug: "python" },
  { label: "Playwright", slug: "playwright" },
  { label: "Cypress", slug: "cypress" },
  { label: "Selenium", slug: "selenium" },
  { label: "REST API", repKey: "restapi" },
  { label: "Agents", repKey: "agents" },
  { label: "CI/CD", repKey: "cicd" },
  { label: "Docker", slug: "docker-icon" },
  { label: "Kubernetes", slug: "kubernetes" },
  { label: "AWS", slug: "aws" },
  { label: "Azure", slug: "microsoft-azure" },
  { label: "GCP", slug: "google-cloud" },
  { label: "Flutter", slug: "flutter" },
];

export const toolIcons: ToolIcon[] = toolMap.map((t) => {
  if (t.slug) {
    const svg = brandLogo(t.slug);
    if (svg) return { label: t.label, svg, brand: true };
  }
  return { label: t.label, svg: rep[t.repKey ?? ""] ?? rep.restapi, brand: false };
});

/**
 * Project logo: a brand logo where one fits, otherwise null so the caller can
 * render a monogram tile.
 */
export function projectLogo(slug?: string): string | null {
  if (!slug) return null;
  return brandLogo(slug);
}
