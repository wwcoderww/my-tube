import Searchbar from "./_components/searchbar";
import List from "./_components/video-list/list";
import Sidebar from "./sidebar";

export default function page() {
  return (
    <div className="flex  h-full">
      <div className="w-1/6">
        <Sidebar />
      </div>
      <div className="w-4/6 overflow-y-scroll bg-zinc-800">
        <Searchbar />
        <List />
      </div>
      <div className="w-1/6 overflow-y-scroll">Downloads</div>
    </div>
  );
}
