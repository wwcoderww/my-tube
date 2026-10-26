export async function getSearch(query: string | undefined) {
  if (!query) return [];

  return await fetch(
    `${process.env.NEXT_BACKEND_URL}/api/video/search?q=${query}`,
  ).then((res) => res.json());
}
