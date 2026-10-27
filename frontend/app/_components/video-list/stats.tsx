import formatTime from "./utils/formatTime";
import formatViews from "./utils/formatViews";

type StatsProps = {
  views: number;
  duration: number | null;
};

export default function Stats({ views, duration }: StatsProps) {
  return (
    <div className="text-sm font-semibold text-zinc-200/70  text-center ">
      <p>
        {formatViews(views)} | {duration && formatTime(duration)}
      </p>
    </div>
  );
}
