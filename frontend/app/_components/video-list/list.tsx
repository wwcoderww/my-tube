import Image from "next/image";

type ListProps = {
  data: {
    id: string;
    title: string;
    uploader: string;
    duration: number;
    views: number;
    thumbnail: string;
  }[];
};

export default function List({ data }: ListProps) {
  return (
    <ul className="">
      {data &&
        data.map((item, index) => (
          <div key={index} className="flex justify-center">
            <Image
              src={item.thumbnail}
              alt={item.title}
              width={250}
              height={250}
            />
            <div className="flex-1 flex flex-col">
              <div className="">
                <div className="text-center text-lg font-semibold">
                  {item.title}
                </div>
                <div className="flex">
                  <div>Icon</div>
                  <div>{item.uploader}</div>
                </div>
              </div>
              <div className="flex flex-1 items-end gap-2 mx-1">
                <div>{item.duration}</div>
                <div>{item.views}</div>
              </div>
            </div>
          </div>
        ))}
    </ul>
  );
}
