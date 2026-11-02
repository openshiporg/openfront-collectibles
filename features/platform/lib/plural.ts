/** "1 item", "2 items", "0 items"; pass the plural when it is not just word + "s". */
export function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

/** Just the noun for a count, for when the number is styled separately: pluralNoun(1, "item") -> "item". */
export function pluralNoun(count: number, one: string, many = `${one}s`) {
  return count === 1 ? one : many;
}
