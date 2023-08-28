import { useState, type DragEvent } from "react";
import { BsArrowsExpand } from "react-icons/bs";

export default function DraggableRectangle() {
  const [state, setState] = useState({
    isDragging: false,
    isResizing: false,
    top: 0,
    height: 128,
    // originalHeight: 128,
    // translateHeight: 0,

    // eeded for repeated resizings. Must retain previous resize position after resize is complete.
    // Item's height is modified
    // lastTranslateHeight: 0,

    originalY: 0,
    translateY: 0,

    // needed for repeated drag and drops. Must retain previous x/y position after drag is complete.
    // Item's position is transformed but item will go back to original position if you drag a 2nd time or 3rd time or...
    lastTranslateY: 0,
  });

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    setState((prev) => ({
      ...prev,
      isDragging: true,
      originalY: e.clientY,
    }));
    window.addEventListener("mousemove", handleDrag);
    window.addEventListener("mouseup", handleDragEnd);
  };

  const handleDrag = (e: MouseEvent) => {
    setState((prev) => ({
      ...prev,
      translateY: e.clientY - prev.originalY + prev.lastTranslateY,
    }));
  };

  const handleDragEnd = () => {
    window.removeEventListener("mousemove", handleDrag);
    window.removeEventListener("mouseup", handleDragEnd);
    setState((prev) => ({
      ...prev,
      isDragging: false,
      lastTranslateY: prev.translateY,
    }));
  };

  const handleResizeStart = (e: DragEvent<HTMLButtonElement>) => {
    // console.log(
    //   `y: ${e.clientY}, originalHeight: ${state.originalHeight}, lastTranslateHeight: ${state.lastTranslateHeight}`
    // );
    e.stopPropagation();
    window.addEventListener("mousemove", handleResize);
    window.addEventListener("mouseup", handleResizeEnd);

    setState((prev) => ({
      ...prev,
      isResizing: true,
    }));
  };

  const handleResize = (e: MouseEvent) => {
    console.log(`y: ${e.clientY}`);
    setState((prev) => ({
      ...prev,
      height: e.clientY,
    }));
  };

  const handleResizeEnd = () => {
    // console.log(
    //   `y: (n/a), originalHeight: ${state.originalHeight}, lastTranslateHeight: ${state.lastTranslateHeight}`
    // );
    window.removeEventListener("mousemove", handleResize);
    window.removeEventListener("mouseup", handleResizeEnd);
    setState((prev) => ({
      ...prev,
      isResizing: false,
      // lastTranslateHeight: prev.translateHeight,
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
      className="w-32 rounded bg-secondary"
      style={{
        cursor: `${state.isDragging ? "grabbing" : "grab"}`,
        transform: `translateY(${state.translateY}px)`,
        height: `${state.height}px`,
        // height: `${
        //   state.translateHeight === 0
        //     ? `${state.originalHeight}px`
        //     : `${state.translateHeight}px`
        // }`,
        //   top: `${state.translateY}px`,
        //   left: `${state.translateX}px`,
      }}>
      <button
        onMouseDown={handleResizeStart}
        onMouseUp={handleResizeEnd}
        type="button"
        className="absolute bottom-1 left-1/2 text-xl text-white"
        style={{
          cursor: `${state.isResizing ? "grabbing" : "s-resize"}`,
        }}>
        <BsArrowsExpand />
      </button>
    </div>
  );
}
