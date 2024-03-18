export function getQueryVector(search: string): string {
  return search.split(' ').join(' | ');
}
