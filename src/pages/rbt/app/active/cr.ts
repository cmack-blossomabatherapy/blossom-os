/** Build a CentralReach deep link when we have an id. Falls back to root. */
export function crClientUrl(id?: string | null): string {
  return id
    ? `https://members.centralreach.com/#clients/${encodeURIComponent(id)}`
    : "https://members.centralreach.com/";
}
export function crSessionUrl(id?: string | null): string {
  return id
    ? `https://members.centralreach.com/#scheduling/${encodeURIComponent(id)}`
    : "https://members.centralreach.com/#scheduling";
}