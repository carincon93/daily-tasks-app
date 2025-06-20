import { useTimerStore } from "@/store/index.store";
import { useEffect, useState } from "react";
import Loading from "@/components/Loader";

export function Timer() {
  const { startTime, running } = useTimerStore();
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!running || !startTime) return;

    const updateElapsedTime = () => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000)); // In seconds
    };

    updateElapsedTime(); // Calculate when the page has loaded

    const interval = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(interval);
  }, [running, startTime]);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  const hours = Math.floor(elapsedTime / 3600);
  const minutes = Number(((elapsedTime - 30) / 60).toFixed(0)) - 60 * hours;
  const seconds = elapsedTime ? (elapsedTime % 60).toString() : "00";

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <Loading className="text-black dark:text-white" />
      </div>
    );

  return (
    <div className="dark:from-gray-800 to-transparent bg-gradient-to-b flex flex-col items-center justify-center space-y-4 p-4 rounded-2xl shadow-md border-x border-t border-gray-400 relative">
      <img
        src="./stopwatch.png"
        alt="timer"
        className="size-18 object-contain"
      />

      <div className="flex space-x-4 text-4xl">
        <div>
          {hours.toString().padStart(2, "0")}:
          {minutes < 0 ? "00" : minutes.toString().padStart(2, "0")}:
          {seconds.padStart(2, "0")}
        </div>
      </div>
    </div>
  );
}
