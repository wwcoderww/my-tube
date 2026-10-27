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
        data.map((item, index) => (
          <div key={index} className="flex justify-center">
            <Image
              src={item.thumbnail || ""}
              alt={item.title}
              width={250}
              height={250}
            />
            <div className="flex-1 flex flex-col">
              <div className="text-center ">
                <p className="text-lg font-semibold">{item.title}</p>
                <p>{item.uploader}</p>
              </div>
              <div className="flex flex-1 justify-between items-end gap-2 mx-1">
                <Stats views={item.views} duration={item.duration} />
                <Buttons />
              </div>
            </div>
          </div>
        ))}
    </ul>
  );
}
