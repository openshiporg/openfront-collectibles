/** "1 item", "2 items", "0 items"; pass the plural when it is not just word + "s". */
export function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}
