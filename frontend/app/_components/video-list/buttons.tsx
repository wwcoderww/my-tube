"use client";

type ButtonsProps = {
  title: string;
  videoId: string;
};

const buttonStyle =
  "border rounded-lg px-2.5 py-1 bg-zinc-700 border-zinc-900 text-zinc-100 hover:cursor-pointer transition ease-in-out duration-200 hover:-translate-y-0.5 active:translate-y-0 hover:shadow-md text-sm font-medium hover:bg-zinc-600";

export default function Buttons({ title, videoId }: ButtonsProps) {
  return (
    <div className=" gap-2 flex">
      <a
        className={buttonStyle}
        href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/video/download?id=${videoId}&formatId=18&ext=mp3&title=${title}`}
      >
        audio
      </a>
      <a
        className={buttonStyle}
        href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/video/download?id=${videoId}&formatId=480&ext=mp4&title=${title}`}
      >
        video
      </a>
    </div>
  );
}
