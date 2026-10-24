export default function List() {
  return (
    <div className="flex justify-center">
      <div className="w-40 h-40 bg-pink-400"></div>
      <div className="flex-1 flex flex-col">
        <div className="">
          <div className="text-center">Title</div>
          <div className="flex">
            <div>Icon</div>
            <div>Author</div>
          </div>
        </div>
        <div className="flex flex-1 items-end gap-2 mx-1">
          <div>04:20</div>
          <div>40m</div>
        </div>
      </div>
    </div>
  );
}
