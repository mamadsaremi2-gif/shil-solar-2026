import Fuse from "fuse.js";

export function fuzzySearch(
  list,
  query
) {

  const fuse =
    new Fuse(list, {

      keys: ["title"],

      threshold: 0.3,

    });

  return fuse.search(query);
}
