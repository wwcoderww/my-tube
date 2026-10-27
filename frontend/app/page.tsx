import { Suspense } from "react";
import Search from "./search";
import Sidebar from "./sidebar";

export type PagePropsType = {
  searchParams: Promise<{ search?: string }>;
};

export default function page({ searchParams }: PagePropsType) {
  return (
    <div className="flex  h-full">
      <div className="w-1/6">
        <Sidebar />
      </div>
      <div className="w-5/6 overflow-y-scroll bg-zinc-800">
        <Suspense fallback={<div>Loading...</div>}>
          <Search searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
