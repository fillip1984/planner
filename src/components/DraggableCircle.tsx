import { useState, type DragEvent } from "react";

export default function DraggableCircle() {
  const [state, setState] = useState({
    isDragging: false,
    originalX: 0,
    originalY: 0,
    translateX: 0,
    translateY: 0,
    // needed for repeated drag and drops. Must retain previous x/y position after drag is complete.
    // Item's position is transformed but item will go back to original position if you drag a 2nd time or 3rd time or...
    lastTranslateX: 0,
    lastTranslateY: 0,
  });

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    setState((prev) => ({
      ...prev,
      isDragging: true,
      originalX: e.clientX,
      originalY: e.clientY,
    }));
    window.addEventListener("mousemove", handleDrag);
    window.addEventListener("mouseup", handleDragEnd);
  };

  const handleDrag = (ev: MouseEvent) => {
    setState((prev) => ({
      ...prev,
      translateX: ev.clientX - prev.originalX + prev.lastTranslateX,
      translateY: ev.clientY - prev.originalY + prev.lastTranslateY,
    }));
  };

  const handleDragEnd = () => {
    window.removeEventListener("mousemove", handleDrag);
    window.removeEventListener("mouseup", handleDragEnd);
    setState((prev) => ({
      ...prev,
      isDragging: false,
      lastTranslateX: prev.translateX,
      lastTranslateY: prev.translateY,
    }));
  };

  return (
    <div
      onMouseDown={handleDragStart}
      onMouseUp={handleDragEnd}
      // reason for onMouseOver and onMouseOut: https://stackoverflow.com/questions/47295211/safari-wrong-cursor-when-dragging
      onMouseOver={() =>
        (document.onselectstart = () => {
          return false;
        })
      }
      onMouseOut={() =>
        (document.onselectstart = () => {
          return true;
        })
      }
      // onDrag={handleDrag}
      className="h-12 w-12 rounded-full bg-primary"
      style={{
        transform: `translate(${state.translateX}px,${state.translateY}px)`,
        cursor: `${state.isDragging ? "grabbing" : "grab"}`,
        //   top: `${state.translateY}px`,
        //   left: `${state.translateX}px`,
      }}></div>
  );
}
