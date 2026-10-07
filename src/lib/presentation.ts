import type { CollectionEntry } from "astro:content";

export type Resource = CollectionEntry<"resources">["data"] & { slug: string };
export const flattenResource = (r: CollectionEntry<"resources">): Resource => ({
  ...r.data,
  slug: r.id,
});
export const categoryHref = (name: string) =>
  "/category/" +
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
export const detailHref = (r: Resource) => `/resource/${r.slug}`;
export const external = (url: string) => /^https?:\/\//.test(url);
export const actionLabel = (url: string) =>
  url.startsWith("mailto:")
    ? "Email"
    : url.startsWith("tel:")
      ? "Call"
      : "Open";
const typeLabels: Record<string, string> = {
  Reference: "Website",
  Process: "Form",
  Payment: "Portal",
};
export const displayType = (r: Resource) => typeLabels[r.type] || r.type;

// Short directory summaries from the approved mockups. Full, authoritative
// descriptions and destinations remain in the content collection and detail page.
const summaries: Record<string, string> = {
  "student-portal-camu-services": "Academic requests and student services.",
  "academic-calendar": "Key dates for the academic year.",
  "academic-request-form": "Academic forms and requests.",
  "course-registration-and-issue-reporting":
    "Registration support and course issues.",
  "pay-university-fees": "University fee payment resources.",
  "maintenance-service-request": "Report broken rooms, fixtures or equipment.",
  "career-portal-careeros": "Career resources and opportunities.",
  "writing-center": "Writing support and appointments.",
};
export const summary = (r: Resource) => summaries[r.slug] || r.description;
export const starterSlugs = [
  "student-portal-camu-services",
  "academic-calendar",
  "maintenance-service-request",
  "career-portal-careeros",
  "writing-center",
];
export const academicSlugs = [
  "student-portal-camu-services",
  "academic-calendar",
  "academic-request-form",
  "course-registration-and-issue-reporting",
  "pay-university-fees",
];
export function prioritize(resources: Resource[], slugs: string[]) {
  return [...resources].sort((a, b) => {
    const ai = slugs.indexOf(a.slug),
      bi = slugs.indexOf(b.slug);
    return (
      (ai < 0 ? 1000 : ai) - (bi < 0 ? 1000 : bi) ||
      a.title.localeCompare(b.title)
    );
  });
}
export function contactInfo(r: Resource) {
  const location =
    r.description.match(/Located at (.+?)(?:\.\s|\.$|$)/)?.[1] || "";
  const phone =
    r.description.match(/Phone:\s*(\+?[\d\s-]+)\.?/)?.[1]?.trim() || "";
  const description = r.description
    .split(/Located at|Phone:/)[0]
    .trim()
    .replace(/[.,]$/, "");
  return {
    location,
    phone,
    description,
    email: r.url.startsWith("mailto:") ? r.url.slice(7) : "",
  };
}
