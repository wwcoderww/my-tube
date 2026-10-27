import Image from "next/image";
import Buttons from "./buttons";
import Stats from "./stats";
import { SearchResult } from "@project/types";

type ListProps = {
  data: SearchResult[];
};

export default function List({ data }: ListProps) {
  return (
    <ul className="">
      {data &&
        data.map((item) => (
          <div key={item.id} className="flex justify-center">
            <Image
              src={item.thumbnail || ""}
              alt={item.title}
              width={300}
              height={300}
            />
            <div className="flex-1 flex flex-col p-1">
              <div className="text-center ">
                <p className="text-lg font-semibold">{item.title}</p>
                <p>{item.uploader}</p>
              </div>
              <div className="flex flex-1 justify-between items-end gap-2 mx-1 pr-1">
                <Stats views={item.views} duration={item.duration} />
                <Buttons title={item.title} videoId={item.id} />
              </div>
            </div>
          </div>
        ))}
    </ul>
  );
}
