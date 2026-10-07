export function classes(base: string, variants: Record<string, boolean>) {
  return [base, ...Object.keys(variants).filter((name) => variants[name])]
    .filter(Boolean)
    .join(" ");
}
