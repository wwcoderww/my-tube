export default function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const formatedSeconds = String(seconds).padStart(2, "0");

  return minutes + ":" + formatedSeconds;
}
