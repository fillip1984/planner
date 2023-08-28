import { useState, type DragEvent, useRef, useEffect } from "react";
import { BsArrowsExpand } from "react-icons/bs";

export default function DraggableRectangle() {
  const rectRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState({
    isDragging: false,
    isResizing: false,

    // drag tuff
    originalY: 0,
    translateY: 0,

    // needed for repeated drag and drops. Must retain previous x/y position after drag is complete.
    // Item's position is transformed but item will go back to original position if you drag a 2nd time or 3rd time or...
    lastTranslateY: 0,

    // resize stuff
    top: 0,
    height: 128,
  });

  useEffect(() => {
    setState((prev) => ({ ...prev, top: rectRef.current?.offsetTop ?? 0 }));
  }, [rectRef, state.lastTranslateY]);

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
    console.log(rectRef.current);
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
    // the arbitrary +15 is because when you start to drag the cursor is too fast. Adding pixels bumps it out
    setState((prev) => ({
      ...prev,
      height: e.clientY - state.top + 15,
    }));
  };

  const handleResizeEnd = () => {
    window.removeEventListener("mousemove", handleResize);
    window.removeEventListener("mouseup", handleResizeEnd);
    setState((prev) => ({
      ...prev,
      isResizing: false,
    }));
  };

  return (
    <div
      ref={rectRef}
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
