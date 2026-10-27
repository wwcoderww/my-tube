"use client";
import useSetParams from "./hooks/useSetParams";

export default function Searchbar() {
  const setQuery = useSetParams();

  return (
    <div className="flex items-center justify-center py-16">
      <input
        type="text"
        className="bg-zinc-300 focus:ring-0 focus:outline-none text-zinc-800 rounded-xl px-2 min-w-1/2 text-lg"
        placeholder="Search..."
        onChange={(e) => setQuery("search", e.target.value)}
      />
    </div>
  );
}
