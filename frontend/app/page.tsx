import { Suspense } from "react";
import Search from "./search";
import Sidebar from "./sidebar";

export type PagePropsType = {
  searchParams: Promise<{ search?: string }>;
};

export default function page({ searchParams }: PagePropsType) {
  return (
    <div className="flex  h-full">
      <div className="w-1/6 bg-zinc-800/10">
        <Sidebar />
      </div>
      <div className="w-4/6 overflow-y-scroll ">
        <Suspense fallback={<div>Loading...</div>}>
          <Search searchParams={searchParams} />
        </Suspense>
      </div>
      <div className="w-1/6 bg-zinc-800/10 text-center">Downloading</div>
    </div>
  );
}
