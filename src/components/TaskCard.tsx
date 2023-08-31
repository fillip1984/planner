import { format, getHours, setHours } from "date-fns";
import { useEffect, useState, type PointerEvent } from "react";
import { BsArrowsExpand } from "react-icons/bs";
import { type Task, type Timeslot } from "~/types";

export default function TaskCard({
  task,
  calculateHourBasedOnCoordinate,
  calculatePosition,
  handleUpdateTask,
}: {
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
  });

  useEffect(() => {
    positionTask();
  }, []);

  const positionTask = () => {
    const timeslots = calculatePosition(task.start, task.end);
    if (timeslots?.[0] && timeslots[1]) {
      const firstTimeslot = timeslots[0];
      const secondTimeslot = timeslots[1];
      setState((prev) => ({
        ...prev,
        isDragging: false,
        isResizing: false,
        translateY: firstTimeslot.top,
        lastTranslateY: firstTimeslot.top,
        height: secondTimeslot.bottom - firstTimeslot.top,
      }));
    }
  };

  const handleDragStart = (e: PointerEvent<HTMLDivElement>) => {
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
    setState((prev) => ({
      ...prev,
      // arbitruary + 15 just makes resizing look more natural. The cursor gets ahead of the resize and padding by + 15 seems to hold the cursor closer to the handle (might be the handle's pixel size maybe?)
      height: e.clientY + 15 - top,
    }));
  };

  const handleResizeEnd = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    positionTask();
  };

  return (
    <div
      className="absolute left-2 right-2 touch-none rounded-md border border-l-4 border-white bg-black p-2"
      style={{
        transform: `translateY(${state.translateY}px)`,
        cursor: `${state.isDragging ? "grabbing" : "grab"}`,
        height: `${state.height}px`,
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
      <h4>Sleep</h4>
      <span>
        {format(task.start, "h aa")} - {format(task.end, "h aa")} (Duration:{" "}
        {getHours(task.end) - getHours(task.start)})
      </span>
      <button
        type="button"
        className="absolute bottom-1 left-1/2 touch-none"
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