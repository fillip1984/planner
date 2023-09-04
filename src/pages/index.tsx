import {
  addSeconds,
  eachHourOfInterval,
  endOfDay,
  format,
  getHours,
  isWithinInterval,
  setHours,
  startOfDay,
} from "date-fns";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import EventCard from "~/components/EventCard";
import { type Event, type Timeslot } from "~/types";
import { roundToNearestHundreth } from "~/utils/numberUtils";

export default function Home() {
  const interval = { start: startOfDay(new Date()), end: endOfDay(new Date()) };
  const hours = eachHourOfInterval(interval);
  const [timeslots, setTimeslots] = useState<Timeslot[]>([]);

  // when calculating hour or top/bottom of timeslots you have to take into account the top position
  // of the agenda. This is because drag and resize send Y coordinate of cursor on the screen which
  // then has to be offset by the agenda's top position to be accurate
  const agendaRef = useRef<HTMLDivElement | null>(null);
  const [agendaTopOffset, setAgendaTopOffset] = useState(0);
  useEffect(() => {
    if (agendaRef) {
      const agendaTop = agendaRef.current?.getBoundingClientRect().top ?? 0;
      setAgendaTopOffset(agendaTop);
    }
  }, [agendaRef]);

  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      start: setHours(startOfDay(new Date()), 2),
      end: setHours(startOfDay(new Date()), 8),
      description: "First",
    },
    {
      id: "2",
      start: setHours(startOfDay(new Date()), 1),
      end: setHours(startOfDay(new Date()), 4),
      description: "Second",
    },
    {
      id: "3",
      start: setHours(startOfDay(new Date()), 2),
      end: setHours(startOfDay(new Date()), 6),
      description: "Third",
    },
    {
      id: "4",
      start: setHours(startOfDay(new Date()), 6),
      end: setHours(startOfDay(new Date()), 9),
      description: "Fourth",
    },
    {
      id: "5",
      start: setHours(startOfDay(new Date()), 9),
      end: setHours(startOfDay(new Date()), 10),
      description: "Fifth",
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

  const calculateHourBasedOnPosition = (clientY: number) => {
    const clientYOffset = clientY - agendaTopOffset;
    const timeslot = timeslots?.find(
      (timeslot) =>
        timeslot.top <= clientYOffset && timeslot.bottom >= clientYOffset
    );

    return timeslot?.hour;
  };

  const calculatePositionBaseOnHour = (start: Date, end: Date) => {
    const firstTimeslot = timeslots.find(
      (timeslot) => timeslot.hour === getHours(start)
    );
    const secondTimeslot = timeslots.find(
      (timeslot) => timeslot.hour === getHours(end)
    );

    // timeslots not found, default to the top of the agenda
    if (!firstTimeslot || !secondTimeslot) {
      return { top: agendaTopOffset, bottom: agendaTopOffset };
    }

    return {
      top: firstTimeslot.top - agendaTopOffset,
      bottom: secondTimeslot.top - agendaTopOffset,
    };
  };

  const calculateWidthPosition = (anEvent: Event) => {
    // build intervals for all events, go to hh:59:59 so that isWithinInterval includes hh:00:00
    // but not hh:59:59
    const allEventIntervals = events.map((allEvent) => {
      return {
        event: allEvent,
        interval: { start: allEvent.start, end: addSeconds(allEvent.end, -1) },
      };
    });
    const timeslotWithEventCounts = timeslots.map((timeslot) => {
      return {
        timeslot,
        events: allEventIntervals
          .filter((eventAndInterval) =>
            isWithinInterval(
              setHours(startOfDay(new Date()), timeslot.hour),
              eventAndInterval.interval
            )
          )
          .sort((eventAndInterval1, eventAndInterval2) => {
            let dur1 =
              getHours(eventAndInterval1.interval.end) -
              getHours(eventAndInterval1.interval.start);
            let dur2 =
              getHours(eventAndInterval2.interval.end) -
              getHours(eventAndInterval2.interval.start);
            if (dur1 === 0) {
              dur1 = 1;
            }
            if (dur2 === 0) {
              dur2 = 1;
            }
            if (dur1 && dur2) {
              const diff = dur2 - dur1;
              if (diff !== 0) {
                return diff;
              }
              // tiebreaker is id sorted numberic or alpha
              console.log(
                "using tiebreaker",
                eventAndInterval1.event.description,
                eventAndInterval2.event.description
              );
              return eventAndInterval1.event.id.localeCompare(
                eventAndInterval2.event.id
              );
            }
            throw new Error("Unable to compare intervals");
          }),
      };
    });

    const timeslotsInvolved = timeslotWithEventCounts.filter(
      (timeslotWithEventCount) =>
        timeslotWithEventCount.events.findIndex(
          (e) => e.event.id === anEvent.id
        ) !== -1
    );

    const maxCollisions = timeslotsInvolved
      .map((t) => t.events.length)
      .reduce((prev, current) => (prev > current ? prev : current), 0);
    const width = roundToNearestHundreth(100 / maxCollisions);

    const position =
      timeslotsInvolved
        .find((t) => t.events.length === maxCollisions)
        ?.events.findIndex((e) => e.event.id === anEvent.id) ?? 0;
    const widthPosition = roundToNearestHundreth(
      (position * 100) / maxCollisions
    );
    return { width, widthPosition };
  };

  const handleUpdateEvent = (start: Date, end: Date, eventId: string) => {
    setEvents((prev) => {
      return prev.map((prevEvent) =>
        prevEvent.id === eventId
          ? {
              ...prevEvent,
              start,
              end,
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

        <div ref={agendaRef} className="flex">
          {/* Draw agenda slot headers (shows the time for each slow, displayed on the left or head of slot) */}
          <div className="flex flex-col">
            {hours.map((hour) => (
              <div
                key={hour.toISOString()}
                data-timeslot={format(hour, "H")}
                className="flex">
                <div className="flex h-20 w-16 items-center justify-center border border-dashed">
                  {format(hour, "h aa")}
                </div>
              </div>
            ))}
          </div>

          {/* Draw agenda slots */}
          <div className="relative flex flex-1 flex-col bg-white/10">
            {hours.map((hour) => (
              <div key={hour.toISOString()} className="flex">
                <div className="flex h-20 flex-1 items-center justify-center border border-dashed text-white/20"></div>
              </div>
            ))}

            {/* Draw events */}
            {events.map((event) => (
              <EventCard
                key={event.id}
                timeslots={timeslots}
                event={event}
                calculateHourBasedOnPosition={calculateHourBasedOnPosition}
                calculatePositionBaseOnHour={calculatePositionBaseOnHour}
                handleUpdateEvent={handleUpdateEvent}
                calculateWidthPosition={calculateWidthPosition}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
