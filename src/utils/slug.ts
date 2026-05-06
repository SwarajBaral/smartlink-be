export function generateSlug(): string {
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 6);
  return `smrt-${id}`;
}
