import {
  eachHourOfInterval,
  endOfDay,
  format,
  getHours,
  parse,
  setHours,
  startOfDay,
} from "date-fns";
import Head from "next/head";
import { useState, type DragEvent } from "react";
import { BsArrowsExpand, BsArrowsMove } from "react-icons/bs";

type Task = {
  start: Date;
  end: Date;
  description: string;
};

export default function Home() {
  const interval = { start: startOfDay(new Date()), end: endOfDay(new Date()) };
  const hours = eachHourOfInterval(interval);

  const [clientY, setClientY] = useState<number | undefined>(undefined);
  const [newClientY, setNewClientY] = useState<number | undefined>(undefined);

  const [task, setTask] = useState<Task>({
    start: parse("2023-08-26 00:00", "yyyy-MM-dd HH:mm", new Date()),
    end: parse("2023-08-26 02:00", "yyyy-MM-dd HH:mm", new Date()),
    description: "Sleeping",
  });

  const calcStart = (task: Task): number => {
    const start = parseInt(format(task.start, "H")) * 5;
    console.log("start", start);
    return start;
  };

  const calcHeight = (task: Task): number => {
    const height = (getHours(task.end) - getHours(task.start)) * 5;
    console.log("height", height);
    return height;
  };

  const handleDragStart = (e: DragEvent<HTMLButtonElement>) => {
    setClientY(e.clientY);
  };

  const handleDrag = (e: DragEvent<HTMLButtonElement>) => {
    //see: https://engineering.datorama.com/mastering-drag-drop-with-reactjs-part-01-39bed3d40a03
    console.log("Y", e.clientY);
    setNewClientY(e.clientY);
  };

  const handleDragEnd = () => {
    if (clientY && newClientY) {
      console.log(newClientY - clientY);
      const translateY = newClientY - clientY;
      const hoursNumber = translateY / 80;
      console.log("hoursNumber", hoursNumber);
      console.log("hoursNumber rounded", Math.round(hoursNumber));
      const hoursToAdjust = Math.round(hoursNumber);
      // const roundedHoursNumber = getHours(task.start) + Math.round(hoursNumber);
      setTask({
        ...task,
        start: setHours(task.start, getHours(task.start) + hoursToAdjust),
        end: setHours(task.end, getHours(task.end) + hoursToAdjust),
      });
    }
  };

  const handleResizeStart = (e: DragEvent<HTMLButtonElement>) => {
    // setClientX(e.clientX);
    setClientY(e.clientY);
  };

  const handleResize = (e: DragEvent<HTMLButtonElement>) => {
    //see: https://engineering.datorama.com/mastering-drag-drop-with-reactjs-part-01-39bed3d40a03
    // setNewClientX(e.clientX);
    setNewClientY(e.clientY);
  };

  const handleResizeEnd = () => {
    if (clientY && newClientY) {
      console.log(newClientY - clientY);
      const translateY = newClientY - clientY;
      const hoursNumber = translateY / 86;
      console.log("hoursNumber", hoursNumber);
      console.log("hoursNumber rounded", Math.round(hoursNumber));
      const roundedHoursNumber = getHours(task.end) + Math.round(hoursNumber);
      setTask({
        ...task,
        end: setHours(task.end, roundedHoursNumber),
      });
    }
  };

  // const handleResizeOver = (hour: string) => {
  //   console.log("over", hour);
  //   const hoursNumber = parseInt(hour);
  //   setTask({
  //     ...task,
  //     end: setHours(task.end, hoursNumber),
  //   });
  // };

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
                  {/* {getHours(hour) === 4 && (
              <div className="m-1 flex flex-1 flex-col rounded bg-accent px-2">
                <h4>4-6</h4>
                <span className="text-xs">Sleep</span>
              </div>
            )} */}
                </div>
              </div>
            ))}
          </div>

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

            <div
              className="absolute left-2 right-2 rounded-md border border-l-4 border-white bg-black p-2"
              style={{
                height: `${calcHeight(task)}rem`,
                top: `${calcStart(task)}rem`,
              }}>
              <button
                draggable
                onDrag={handleDrag}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                type="button"
                className="absolute left-1/2 top-1 ">
                <BsArrowsMove />
              </button>
              <h4>Sleep</h4>
              <span>
                {format(task.start, "h aa")} - {format(task.end, "h aa")}{" "}
                (Duration: {getHours(task.end) - getHours(task.start)})
              </span>
              <button
                draggable
                onDrag={handleResize}
                onDragStart={handleResizeStart}
                onDragEnd={handleResizeEnd}
                type="button"
                className="absolute bottom-1 left-1/2 ">
                <BsArrowsExpand />
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
