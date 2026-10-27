import formatTime from "./utils/formatTime";
import formatViews from "./utils/formatViews";

type StatsProps = {
  views: number;
  duration: number | null;
};

export default function Stats({ views, duration }: StatsProps) {
  return (
    <div className="flex gap-1 flex-col text-sm font-medium text-zinc-200/70 pl-1 divide-y text-center divide-zinc-500">
      <p>{formatViews(views)}</p>
      <p>{duration && formatTime(duration)}</p>
    </div>
  );
}
