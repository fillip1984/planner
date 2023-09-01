import {
  differenceInHours,
  eachHourOfInterval,
  endOfDay,
  format,
  getHours,
  parse,
  startOfDay,
} from "date-fns";
import Head from "next/head";
import { useEffect, useState } from "react";
import EventCard from "~/components/EventCard";
import { type Event, type Timeslot } from "~/types";

export default function Home() {
  const interval = { start: startOfDay(new Date()), end: endOfDay(new Date()) };
  const hours = eachHourOfInterval(interval);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);

  //differenceInHours(start, end) <-- generates duration
  const [events, setEvents] = useState<Event[]>([
    {
      start: parse("2023-08-26 02:00", "yyyy-MM-dd HH:mm", new Date()),
      end: parse("2023-08-26 04:00", "yyyy-MM-dd HH:mm", new Date()),
      duration: 2,
      description: "Sleeping",
    },
    {
      start: parse("2023-08-26 01:00", "yyyy-MM-dd HH:mm", new Date()),
      end: parse("2023-08-26 02:00", "yyyy-MM-dd HH:mm", new Date()),
      duration: 2,
      description: "Eating",
    },
  ]);

  useEffect(() => {
    handleTimeslots();
  }, []);

  const handleTimeslots = () => {
    const calculatedTimeslots: Timeslot[] = [];
    const timeslotDivs = document.querySelectorAll("[data-timeslot") as unknown;

    (timeslotDivs as HTMLDivElement[]).forEach((timeslotDiv) => {
      if (!timeslotDiv.dataset.timeslot) {
        throw new Error("Missing timeslot data attribute");
      }
      calculatedTimeslots.push({
        hour: parseInt(timeslotDiv.dataset.timeslot),
        top: timeslotDiv.getBoundingClientRect().top,
        bottom:
          timeslotDiv.getBoundingClientRect().top +
          timeslotDiv.getBoundingClientRect().height,
      });
    });
    setTimeslots(calculatedTimeslots);
  };

  const calculateHourBasedOnCoordinate = (clientY: number) => {
    const timeslot = timeslots?.find(
      (timeslot) => timeslot.top <= clientY && timeslot.bottom >= clientY
    );

    return timeslot;
  };

  const calculatePosition = (start: Date, end: Date) => {
    const firstTimeslot = timeslots.find(
      (timeslot) => timeslot.hour === getHours(start)
    );
    const secondTimeslot = timeslots.find(
      (timeslot) => timeslot.hour === getHours(end)
    );
    return [firstTimeslot, secondTimeslot];
  };

  const handleUpdateEvent = (start: Date, end: Date, eventId: string) => {
    setEvents((prev) => {
      return prev.map((prevEvent) =>
        prevEvent.description === eventId
          ? {
              ...prevEvent,
              start,
              end,
              duration: differenceInHours(end, start),
            }
          : prevEvent
      );
    });
  };

  return (
    <>
      <Head>
        <title>Planner App</title>
        <meta name="description" content="Daily planner" />
        {/* <link rel="icon" href="/favicon.ico" /> */}
      </Head>
      <main className="flex min-h-screen flex-col bg-black text-white">
        {/* <h2>Planner</h2> */}

        <div className="flex">
          <div className="flex flex-col">
            {hours.map((hour) => (
              <div
                key={hour.toISOString()}
                data-timeslot={format(hour, "H")}
                className="flex">
                <div className="flex h-20 w-16 items-center justify-center border border-dashed p-2">
                  {format(hour, "h aa")}
                </div>
              </div>
            ))}
          </div>

          {/* Draw agenda slots */}
          <div className="relative flex flex-1 flex-col bg-white/10">
            {hours.map((hour) => (
              <div key={hour.toISOString()} className="flex">
                <div className="flex h-20 flex-1 items-center justify-center border border-dashed p-2 text-white/20">
                  Available ({format(hour, "h aa")})
                </div>
              </div>
            ))}

            {/* Draw events */}
            {events.map((event) => (
              <EventCard
                key={event.description}
                timeslots={timeslots}
                event={event}
                calculateHourBasedOnCoordinate={calculateHourBasedOnCoordinate}
                calculatePosition={calculatePosition}
                handleUpdateEvent={handleUpdateEvent}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
