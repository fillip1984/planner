import { format, getHours, setHours } from "date-fns";
import { useEffect, useState, type PointerEvent } from "react";
import { BsArrowsExpand } from "react-icons/bs";
import { type Event, type Timeslot } from "~/types";

// adds some padding to show that event card falls within timeslot
const CARD_Y_PADDING = 3;

type EventCardState = {
  isDragging: boolean;
  originalY: number;
  translateY: number;
  lastTranslateY: number;

  isResizing: boolean;
  height: number;

  widthPosition: widthPositionType;

  isModalOpen: boolean;
};

export type widthPositionType =
  | "firstOf2"
  | "secondOf2"
  | "firstOf3"
  | "secondOf3"
  | "thirdOf3"
  | "firstOf4"
  | "secondOf4"
  | "thirdOf4"
  | "fourthOf4"
  | "full";

export default function EventCard({
  timeslots,
  event,
  calculateHourBasedOnPosition,
  calculatePositionBaseOnHour,
  handleUpdateEvent,
  calculateWidthPosition,
}: {
  timeslots: Timeslot[];
  event: Event;
  calculateHourBasedOnPosition: (clientY: number) => number | undefined;
  calculatePositionBaseOnHour: (
    start: Date,
    end: Date
  ) => { top: number | undefined; bottom: number | undefined };
  handleUpdateEvent: (start: Date, end: Date, id: string) => void;
  calculateWidthPosition: (event: Event) => widthPositionType;
}) {
  const [state, setState] = useState<EventCardState>({
    //drag props
    isDragging: false,
    originalY: 0,
    translateY: 0,
    lastTranslateY: 0,

    //resize props
    isResizing: false,
    height: 0,

    //both drag and resize
    widthPosition: "full",

    isModalOpen: false,
  });

  useEffect(() => {
    positionEvent();
  }, [timeslots]);

  const positionEvent = () => {
    if (timeslots) {
      console.log({ event: "Positioning event", id: event.id });
      const { top, bottom } = calculatePositionBaseOnHour(
        event.start,
        event.end
      );
      const widthPosition = calculateWidthPosition(event);
      if (top !== undefined && bottom != undefined) {
        setState((prev) => ({
          ...prev,
          isDragging: false,
          isResizing: false,
          translateY: top + CARD_Y_PADDING,
          lastTranslateY: top,

          height: bottom - top - CARD_Y_PADDING * 2,

          widthPosition,
        }));
      }
    }
  };

  const handleDragStart = (e: PointerEvent<HTMLDivElement>) => {
    if (e.detail == 2) {
      handleDoubleClick();
      return;
    }
    console.log({ event: "Drag start", id: event.id });
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
    console.log({ event: "Draging", id: event.id });

    const newY = e.clientY - state.originalY + state.lastTranslateY;

    const hour = calculateHourBasedOnPosition(newY);
    if (hour !== undefined && getHours(event.start) !== hour) {
      const change = getHours(event.start) - hour;
      handleUpdateEvent(
        setHours(event.start, hour),
        setHours(event.end, getHours(event.end) - change),
        event.id
      );
    }

    setState((prev) => ({
      ...prev,
      translateY: newY,
    }));
  };

  const handleDragEnd = () => {
    console.log({ event: "Drag end", id: event.id });
    setState((prev) => ({
      ...prev,
      isDragging: false,
    }));
    positionEvent();
  };

  const handleResizeStart = (e: PointerEvent<HTMLButtonElement>) => {
    console.log({ event: "Resize start", id: event.id });
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
    console.log({ event: "Resizing", id: event.id });

    const bottom =
      e.currentTarget.parentElement?.getBoundingClientRect().bottom ?? 0;
    const hour = calculateHourBasedOnPosition(bottom);

    setState((prev) => ({
      ...prev,
      // arbitruary + 15 just makes resizing look more natural.
      // The cursor gets ahead of the resize and padding by + 15
      // seems to hold the cursor closer to the handle
      // (might be the handle's pixel size maybe?)
      height: e.clientY + 15,
    }));
    if (hour && getHours(event.end) !== hour + 1) {
      handleUpdateEvent(event.start, setHours(event.end, hour + 1), event.id);
    }
  };

  const handleResizeEnd = (e: PointerEvent<HTMLButtonElement>) => {
    console.log({ event: "Resize end", id: event.id });
    e.currentTarget.releasePointerCapture(e.pointerId);
    setState((prev) => ({
      ...prev,
      isResizing: false,
    }));
    positionEvent();
  };

  const handleDoubleClick = () => {
    console.log({ event: "Double click", id: event.id });
    setState((prev) => ({ ...prev, isModalOpen: !prev.isModalOpen }));
  };

  const widthPositionStyle = () => {
    console.log({ event: "Width position style", id: event.id });
    switch (state.widthPosition) {
      case "firstOf2":
        return "0% 50% 0% 0%";
      case "secondOf2":
        return "0% 0% 0% 50%";
      case "firstOf3":
        return "0% 66% 0% 0%";
      case "secondOf3":
        return "0% 34% 0% 34%";
      case "thirdOf3":
        return "0% 0% 0% 66%";
      case "firstOf4":
        return "0% 75% 0% 0%";
      case "secondOf4":
        return "0% 50% 0% 25%";
      case "thirdOf4":
        return "0% 25% 0% 50%";
      case "fourthOf4":
        return "0% 0% 0% 75%";
      default:
        return "0% 0% 0% 0%";
    }
  };

  return (
    <div
      className="absolute left-2 right-2 min-h-[60px] touch-none select-none rounded-md border border-l-4 border-white bg-black p-2"
      style={{
        transform: `translateY(${state.translateY}px)`,
        cursor: `${state.isDragging ? "grabbing" : "grab"}`,
        height: `${state.height}px`,
        zIndex: `${state.isDragging || state.isResizing ? "999" : "0"}`,
        inset: `${widthPositionStyle()}`,
      }}
      onPointerDown={handleDragStart}
      onPointerMove={handleDrag}
      onPointerUp={handleDragEnd}
      // onPointerCancel={handleDragEnd}
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
      <h4>{event.description}</h4>
      <span>
        {format(event.start, "h aa")} - {format(event.end, "h aa")} (Duration:{" "}
        {getHours(event.end) - getHours(event.start)})
        {state.isModalOpen && "Modal time!"}
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
