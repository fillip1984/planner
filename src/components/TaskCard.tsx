import { format, getHours, setHours } from "date-fns";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useState,
  type DragEvent,
} from "react";
import { BsArrowsExpand, BsArrowsMove } from "react-icons/bs";
import { type Task } from "~/types";

export default function TaskCard({
  task,
  setTasks,
}: {
  task: Task;
  setTasks: Dispatch<SetStateAction<Task[]>>;
}) {
  const [clientY, setClientY] = useState<number | undefined>(undefined);
  const [newClientY, setNewClientY] = useState<number | undefined>(undefined);

  const [height, setHeight] = useState(0);
  const [top, setTop] = useState(0);
  useEffect(() => {
    setHeight(calcHeight(task));
    setTop(calcStart(task));
  }, [task]);

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
    if (!clientY) {
      return;
    }

    console.log("Y", e.clientY);
    const translateY = e.clientY - clientY;
    const hoursNumber = translateY / 80;
    // console.log("hoursNumber", hoursNumber);
    // console.log("hoursNumber rounded", Math.round(hoursNumber));
    const hoursToAdjust = Math.round(hoursNumber);
    // const roundedHoursNumber = getHours(task.start) + Math.round(hoursNumber);
    setTasks((prev) => {
      return prev.map((prevTask) =>
        prevTask.description === task.description
          ? {
              ...prevTask,
              start: setHours(
                prevTask.start,
                getHours(prevTask.start) + hoursToAdjust
              ),
              end: setHours(
                prevTask.end,
                getHours(prevTask.end) + hoursToAdjust
              ),
            }
          : prevTask
      );
    });
  };

  const handleDragEnd = () => {
    // if (clientY && newClientY) {
    // console.log(newClientY - clientY);
    // const translateY = newClientY - clientY;
    // const hoursNumber = translateY / 80;
    // console.log("hoursNumber", hoursNumber);
    // console.log("hoursNumber rounded", Math.round(hoursNumber));
    // const hoursToAdjust = Math.round(hoursNumber);
    // const roundedHoursNumber = getHours(task.start) + Math.round(hoursNumber);
    // setTask({
    // ...task,
    // start: setHours(task.start, getHours(task.start) + hoursToAdjust),
    // end: setHours(task.end, getHours(task.end) + hoursToAdjust),
    // });
    // }
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
      // console.log(newClientY - clientY);
      const translateY = newClientY - clientY;
      const hoursNumber = translateY / 86;
      // console.log("hoursNumber", hoursNumber);
      // console.log("hoursNumber rounded", Math.round(hoursNumber));
      const roundedHoursNumber = getHours(task.end) + Math.round(hoursNumber);
      setTasks((prev) => {
        return prev.map((prevTask) =>
          prevTask.description === task.description
            ? {
                ...prevTask,
                end: setHours(prevTask.end, roundedHoursNumber),
              }
            : prevTask
        );
      });
    }
  };

  return (
    <div
      className="absolute left-2 right-2 rounded-md border border-l-4 border-white bg-black p-2"
      style={{
        height: `${height}rem`,
        top: `${top}rem`,
        // height: `${calcHeight(task)}rem`,
        // top: `${calcStart(task)}rem`,
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
        {format(task.start, "h aa")} - {format(task.end, "h aa")} (Duration:{" "}
        {getHours(task.end) - getHours(task.start)})
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
  );
}
