import Searchbar from "./_components/searchbar";
import List from "./_components/video-list/list";

export default function page() {
  return (
    <div className="flex divide-x h-full divide-white">
      <div className="w-1/4">Sidebar</div>
      <div className="w-1/2 overflow-y-scroll">
        <Searchbar />
        <List />
      </div>
      <div className="w-1/4 overflow-y-scroll">Downloads</div>
    </div>
  );
}
