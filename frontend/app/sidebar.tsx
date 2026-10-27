import Links from "./_components/sidebar/links";

export default function SideBar() {
  return (
    <div className="divide-y divide-zinc-800 capitalize  h-full ">
      <div className="py-3 px-2 font-bold text-center text-xl text-red-500 border-b border-zinc-300/90">
        MyTube
      </div>
      <Links />
    </div>
  );
}
