import { SearchResult } from "@project/types";

export async function getSearch(query: string): Promise<SearchResult[]> {
  try {
    const fetchResponse = await fetch(
      `${process.env.NEXT_BACKEND_URL}/api/video/search?q=${query}`,
    ).then((res) => res.json());

    if (Array.isArray(fetchResponse)) return fetchResponse;

    console.log(fetchResponse);
    return [];
  } catch (error) {
    console.log(error);
    return [];
  }
}
