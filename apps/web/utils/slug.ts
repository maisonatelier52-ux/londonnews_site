export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function withNumericSuffix(base: string, attempt = 0) {
  return attempt > 0 ? `${base}-${attempt + 1}` : base;
}
