import { eachHourOfInterval, endOfDay, format, startOfDay } from "date-fns";
import Head from "next/head";

export default function Home() {
  const interval = { start: startOfDay(new Date()), end: endOfDay(new Date()) };
  const workingHours = eachHourOfInterval(interval);
  // eachHourOfInterval;
  return (
    <>
      <Head>
        <title>Planner App</title>
        <meta name="description" content="Daily planner" />
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>
      <main className="flex min-h-screen flex-col bg-black text-white">
        <h2>Planner</h2>

        <div className="p-2">
          {workingHours.map((workingHour) => (
            <div key={workingHour.toISOString()} className="flex h-24">
              <div className="flex w-14 items-center justify-center">
                <h4>{format(workingHour, "haa")}</h4>
              </div>
              <div className="flex-1 border border-dashed border-accent/60 p-1">
                <div className="h-full bg-accent2 p-2">5:00</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
