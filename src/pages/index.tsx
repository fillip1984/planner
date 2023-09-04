import {
  addSeconds,
  eachHourOfInterval,
  endOfDay,
  format,
  getHours,
  getMinutes,
  intervalToDuration,
  isWithinInterval,
  setHours,
  startOfDay,
} from "date-fns";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import EventCard from "~/components/EventCard";
import { type AgendaEvent, type Timeslot } from "~/types";
import { convertIntervalToMinutes } from "~/utils/dateUtils";
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

  const [events, setEvents] = useState<AgendaEvent[]>([
    {
      id: "1",
      start: setHours(startOfDay(new Date()), 2),
      end: setHours(startOfDay(new Date()), 8),
      description: "First",
      startX: 0,
      endX: 0,
    },
    {
      id: "2",
      start: setHours(startOfDay(new Date()), 1),
      end: setHours(startOfDay(new Date()), 4),
      description: "Second",
      startX: 0,
      endX: 0,
    },
    {
      id: "3",
      start: setHours(startOfDay(new Date()), 2),
      end: setHours(startOfDay(new Date()), 6),
      description: "Third",
      startX: 0,
      endX: 0,
    },
    {
      id: "4",
      start: setHours(startOfDay(new Date()), 6),
      end: setHours(startOfDay(new Date()), 9),
      description: "Fourth",
      startX: 0,
      endX: 0,
    },
    {
      id: "5",
      start: setHours(startOfDay(new Date()), 9),
      end: setHours(startOfDay(new Date()), 10),
      description: "Fifth",
      startX: 0,
      endX: 0,
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
        throw new Error(
          "Missing timeslot data, data attribute does not contain a value"
        );
      }
      const hour = parseInt(timeslotDiv.dataset.timeslot);
      calculatedTimeslots.push({
        hour,
        date: setHours(startOfDay(new Date()), hour),
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

  const calculateWidthPosition = () => {
    // figure out duration for events, sort list longest to shortest
    const eventsSortedByDuration = events
      .map((event) => ({
        event,
        // build intervals for all events, go to hh:59:59 so that isWithinInterval includes hh:00:00
        // but not hh:59:59
        interval: { start: event.start, end: addSeconds(event.end, -1) },
        duration: convertIntervalToMinutes({
          start: event.start,
          end: event.end,
        }),
      }))
      .sort((dur1, dur2) => {
        const diff = dur2.duration - dur1.duration;
        if (diff !== 0) {
          return diff;
        }
        return dur2.event.id.localeCompare(dur1.event.id);
      });
    // console.dir({ eventsSortedByDuration });

    //build out timeslots
    const timeslotsWithEvents = timeslots.map((timeslot) => ({
      timeslot,
      events: eventsSortedByDuration.filter((e) =>
        isWithinInterval(timeslot.date, e.interval)
      ),
    }));
    // console.dir({ timeslotsWithEvents });

    // figure out event conflict count
    const conflictCounts = eventsSortedByDuration.map((esbd) => {
      const tsis = timeslotsWithEvents.filter((ts) =>
        ts.events.find((e) => e.event.id === esbd.event.id)
      );
      const m = tsis
        .map((t) => t.events.length - 1)
        .reduce((prev, current) => (prev > current ? prev : current), 0);
      return { event: esbd, conflictCount: m };
    });
    // console.dir({ conflictCounts });

    // figure out duration for events, sort list longest to shortest
    // const eventsWithDurationInMinutes = events
    //   .map((event) => {
    //     const interval = { start: event.start, end: event.end };
    //     const duration = intervalToDuration(interval);
    //     const durationInMinutes =
    //       (duration.minutes ?? 0) + (duration.hours ?? 0 * 60);
    //     // console.log(duration, durationInMinutes);
    //     return {
    //       event,
    //       durationInMinutes,
    //     };
    //   })
    //   .sort((dur1, dur2) => {
    //     const diff = dur2.durationInMinutes - dur1.durationInMinutes;
    //     if (diff !== 0) {
    //       return diff;
    //     }
    //     return dur2.event.id.localeCompare(dur1.event.id);
    //   });
    // console.dir({ eventsWithDurationInMinutes });

    // figure out event conflict
    // const eventsWithConflictCount = eventsWithDurationInMinutes.map(
    //   (eventWithDurationInMinutes) => {
    //     const interval = {
    //       start: eventWithDurationInMinutes.event.start,
    //       end: eventWithDurationInMinutes.event.end,
    //     };
    //     const maxConflictCount = 0;
    //     return { eventWithDurationInMinutes, maxConflictCount };
    //   }
    // );
    // console.dir({ eventsWithConflictCount });

    // going from longest event, figure out start and end x percentage
    let startX = 0;
    let endX = 0;
    const updates = eventsSortedByDuration.map((e) => {
      startX = endX;
      const conflictCount = conflictCounts.find(
        (cc) => cc.event.event.id === e.event.id
      );
      if (!conflictCount) {
        throw new Error("Error");
      }
      const totalConflicts = conflictCount.conflictCount + 1;

      endX = roundToNearestHundreth(100 - (startX + 100 / totalConflicts));
      console.log({
        id: e.event.description,
        conflictCount: totalConflicts,
        startX,
        endX,
      });
      return {
        event: e.event,
        startX,
        endX,
      };
    });

    //update events
    setEvents((prev) => {
      return prev.map((prevEvent) => ({
        ...prevEvent,
        startX:
          updates.find((update) => update.event.id === prevEvent.id)?.startX ??
          0,
        endX:
          updates.find((update) => update.event.id === prevEvent.id)?.endX ?? 0,
      }));
    });
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
