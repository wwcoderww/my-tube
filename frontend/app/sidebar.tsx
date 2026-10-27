import Links from "./_components/sidebar/links";

export default function SideBar() {
  return (
    <div className="divide-y divide-zinc-800 capitalize bg-zinc-800/20 h-full bg-linear-to-r from-zinc-800/20 to-zinc-900">
      <div className="py-3 px-2 font-bold text-center text-xl text-red-500 border-b border-zinc-300/90">
        MyTube
      </div>
      <Links />
    </div>
  );
}
