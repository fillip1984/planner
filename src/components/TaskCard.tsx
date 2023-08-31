import { format, getHours, setHours } from "date-fns";
import { useEffect, useState, type PointerEvent } from "react";
import { BsArrowsExpand } from "react-icons/bs";
import { type Task, type Timeslot } from "~/types";

export default function TaskCard({
  timeslots,
  task,
  calculateHourBasedOnCoordinate,
  calculatePosition,
  handleUpdateTask,
}: {
  timeslots: Timeslot[];
  task: Task;
  calculateHourBasedOnCoordinate: (clientY: number) => Timeslot | undefined;
  calculatePosition: (start: Date, end: Date) => (Timeslot | undefined)[];
  handleUpdateTask: (start: Date, end: Date, id: string) => void;
}) {
  const [state, setState] = useState({
    //drag props
    isDragging: false,
    originalY: 0,
    translateY: 0,
    lastTranslateY: 0,

    //resize props
    isResizing: false,
    height: 0,

    isDouble: false,
  });

  useEffect(() => {
    positionTask();
  }, [timeslots]);

  const positionTask = () => {
    const timeslots = calculatePosition(task.start, task.end);
    if (timeslots?.[0] && timeslots[1]) {
      const firstTimeslot = timeslots[0];
      const secondTimeslot = timeslots[1];
      setState((prev) => ({
        ...prev,
        isDragging: false,
        isResizing: false,
        // give some margin is reason for +5
        translateY: firstTimeslot.top + 5,
        lastTranslateY: firstTimeslot.top,
        // give some margin is reason for -10
        height: secondTimeslot.top - firstTimeslot.top - 10,
      }));
    }
  };

  const handleDragStart = (e: PointerEvent<HTMLDivElement>) => {
    if (e.detail == 2) {
      handleDoubleClick();
      return;
    }
    setState((prev) => ({
      ...prev,
      isDragging: true,
      originalY: e.clientY,
    }));
  };

  const handleDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (!state.isDragging) {
      return;
    }

    const newY = e.clientY - state.originalY + state.lastTranslateY;

    const timeslot = calculateHourBasedOnCoordinate(newY);
    if (timeslot && getHours(task.start) !== timeslot.hour) {
      handleUpdateTask(
        setHours(task.start, timeslot.hour),
        setHours(task.end, timeslot.hour + task.duration),
        task.description
      );
    }

    setState((prev) => ({
      ...prev,
      translateY: newY,
    }));
  };

  const handleDragEnd = () => {
    positionTask();
  };

  const handleResizeStart = (e: PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setState((prev) => ({
      ...prev,
      isResizing: true,
    }));
  };

  const handleResize = (e: PointerEvent<HTMLButtonElement>) => {
    if (!state.isResizing) {
      return;
    }

    // you have to find out how far off the top of the visible screen the item is to resize it
    //properly. The clientY gives coordinates to where the cursor is on the visible screen so you
    // have to remove that to accurately resize the element. Otherwise when you start resizing the
    // element will jump the number of pixels that exist between the top of the element to the top
    // of the screen
    const top = e.currentTarget.parentElement?.getBoundingClientRect().top ?? 0;
    const bottom =
      e.currentTarget.parentElement?.getBoundingClientRect().bottom ?? 0;
    const timeslot = calculateHourBasedOnCoordinate(bottom);

    setState((prev) => ({
      ...prev,
      // arbitruary + 15 just makes resizing look more natural. The cursor gets ahead of the resize and padding by + 15 seems to hold the cursor closer to the handle (might be the handle's pixel size maybe?)
      height: e.clientY + 15 - top,
    }));
    if (timeslot && getHours(task.end) !== timeslot.hour + 1) {
      handleUpdateTask(
        task.start,
        setHours(task.end, timeslot.hour + 1),
        task.description
      );
    }
  };

  const handleResizeEnd = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    positionTask();
  };

  const handleDoubleClick = () => {
    setState((prev) => ({ ...prev, isDouble: !prev.isDouble }));
  };

  return (
    <div
      className="absolute left-2 right-2 min-h-[60px] touch-none select-none rounded-md border border-l-4 border-white bg-black p-2"
      style={{
        transform: `translateY(${state.translateY}px)`,
        cursor: `${state.isDragging ? "grabbing" : "grab"}`,
        height: `${state.height}px`,
        zIndex: `${state.isDragging || state.isResizing ? "999" : "0"}`,
        // top: `${top}rem`,
        // height: `${calcHeight(task)}rem`,
        // top: `${calcStart(task)}rem`,
      }}
      onPointerDown={handleDragStart}
      onPointerMove={handleDrag}
      onPointerUp={handleDragEnd}
      // reason for onMouseOver and onMouseOut: https://stackoverflow.com/questions/47295211/safari-wrong-cursor-when-dragging
      onMouseOver={() => {
        document.onselectstart = () => {
          return false;
        };
      }}
      onMouseOut={() => {
        document.onselectstart = () => {
          return true;
        };
      }}>
      <h4>{task.description}</h4>
      <span>
        {format(task.start, "h aa")} - {format(task.end, "h aa")} (Duration:{" "}
        {getHours(task.end) - getHours(task.start)})
        {state.isDouble && "Modal time!"}
      </span>
      <button
        type="button"
        className="absolute bottom-1 left-1/2 touch-none text-2xl text-white/50 sm:text-base"
        style={{
          cursor: `${state.isResizing ? "grabbing" : "s-resize"}`,
        }}
        onPointerDown={handleResizeStart}
        onPointerMove={handleResize}
        onPointerUp={handleResizeEnd}
        // onPointerCancel={handleResizeEnd}
        // reason for onMouseOver and onMouseOut: https://stackoverflow.com/questions/47295211/safari-wrong-cursor-when-dragging
        onMouseOver={() => {
          document.onselectstart = () => {
            return false;
          };
        }}
        onMouseOut={() => {
          document.onselectstart = () => {
            return true;
          };
        }}>
        <BsArrowsExpand />
      </button>
    </div>
  );
}
