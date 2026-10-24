export default function Searchbar() {
  return (
    <div className="flex items-center justify-center py-8">
      <input
        type="text"
        className="bg-zinc-300 focus:ring-0 focus:outline-none text-zinc-800 rounded-lg px-2 min-w-1/2"
        placeholder="Search..."
      />
    </div>
  );
}
