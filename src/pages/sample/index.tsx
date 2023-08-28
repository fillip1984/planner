import DraggableCircle from "~/components/DraggableCircle";
import DraggableRectangle from "~/components/DraggableRectangle";

export default function Home() {
  return (
    <main className="h-screen w-screen bg-white p-2">
      <DraggableCircle />
      <DraggableRectangle />
    </main>
  );
}
