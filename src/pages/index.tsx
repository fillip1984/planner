import {
  eachHourOfInterval,
  endOfDay,
  format,
  parse,
  startOfDay,
} from "date-fns";
import Head from "next/head";
import { useState } from "react";
import TaskCard from "~/components/TaskCard";
import { type Task } from "~/types";

export default function Home() {
  const interval = { start: startOfDay(new Date()), end: endOfDay(new Date()) };
  const hours = eachHourOfInterval(interval);

  const [tasks, setTasks] = useState<Task[]>([
    {
      start: parse("2023-08-26 00:00", "yyyy-MM-dd HH:mm", new Date()),
      end: parse("2023-08-26 02:00", "yyyy-MM-dd HH:mm", new Date()),
      description: "Sleeping",
    },
  ]);

  return (
    <>
      <Head>
        <title>Planner App</title>
        <meta name="description" content="Daily planner" />
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>
      <main className="flex min-h-screen flex-col bg-black text-white">
        <h2>Planner</h2>

        <div className="flex p-4">
          <div className="flex flex-col">
            {hours.map((hour) => (
              <div key={hour.toISOString()} className="flex">
                <div className="flex h-20 w-16 items-center justify-center border border-dashed p-2">
                  {format(hour, "h aa")}
                </div>
              </div>
            ))}
          </div>

          {/* Draw agenda slots */}
          <div className="relative flex flex-1 flex-col bg-white/10">
            {hours.map((hour) => (
              <div key={hour.toISOString()} className="flex">
                <div
                  // onDragEnter={() => handleResizeOver(format(hour, "H"))}
                  className="flex h-20 flex-1 items-center justify-center border border-dashed p-2 text-white/20">
                  Available ({format(hour, "h aa")})
                </div>
              </div>
            ))}

            {/* Draw tasks */}
            {tasks.map((task) => (
              <TaskCard
                key={task.description}
                task={task}
                setTasks={setTasks}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
