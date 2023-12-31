import {
  addSeconds,
  differenceInMinutes,
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
import { type AgendaEvent, type Timeslot } from "~/types";
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
      left: 0,
      right: 0,
    },
    {
      id: "2",
      start: setHours(startOfDay(new Date()), 1),
      end: setHours(startOfDay(new Date()), 4),
      description: "Second",
      left: 0,
      right: 0,
    },
    {
      id: "3",
      start: setHours(startOfDay(new Date()), 2),
      end: setHours(startOfDay(new Date()), 5),
      description: "Third",
      left: 0,
      right: 0,
    },
    {
      id: "4",
      start: setHours(startOfDay(new Date()), 6),
      end: setHours(startOfDay(new Date()), 9),
      description: "Fourth",
      left: 0,
      right: 0,
    },
    {
      id: "5",
      start: setHours(startOfDay(new Date()), 9),
      end: setHours(startOfDay(new Date()), 10),
      description: "Fifth",
      left: 0,
      right: 0,
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
    console.log("width positioning run starting");
    // sort events by duration, longest to shortest, using id as tiebreaker
    const eventsSortedByDuration = events
      .map((event) => ({
        event,
        durationInMinutes: differenceInMinutes(event.end, event.start),
        interval: { start: event.start, end: addSeconds(event.end, -1) },
      }))
      .sort((e1, e2) => {
        const diff = e2.durationInMinutes - e1.durationInMinutes;
        if (diff !== 0) {
          return diff;
        }
        return e1.event.id.localeCompare(e2.event.id);
      });
    // console.dir({ eventsSortedByDuration });

    // sort events by number of conflicts, most to least, using id as tiebreaker
    const timeslotWithEvents = timeslots
      .map((timeslot) => {
        const eventsInTimeslot = eventsSortedByDuration.filter((e) =>
          isWithinInterval(timeslot.date, e.interval)
        );

        return {
          timeslot,
          eventsInTimeslot,
        };
      })
      .filter((timeslot) => timeslot.eventsInTimeslot.length > 0);
    // console.dir({ timeslotWithEvents });

    const eventsSortedByConflictCount = events
      .map((event) => {
        const timeslots = timeslotWithEvents.filter((timeslot) =>
          timeslot.eventsInTimeslot.find((e) => e.event.id === event.id)
        );
        const maxConflictCount = timeslots
          .map((timeslot) => timeslot.eventsInTimeslot.length)
          .reduce((prev, current) => (prev > current ? prev : current), 0);

        //subtract 1 to remove counting self
        return { event, maxConflictCount: maxConflictCount - 1 };
      })
      .sort((e1, e2) => {
        const diff = e2.maxConflictCount - e1.maxConflictCount;
        if (diff !== 0) {
          return diff;
        }
        return e1.event.id.localeCompare(e2.event.id);
      });
    // console.dir({ eventsSortedByConflictCount });

    // lay events out going from longest duration to shortest duration
    // if no conflicts, left and right are 0
    // if conflicts, left is currentLeft (last item's left), right is 100/conflict count
    // unless, currentLeft is > 100, then we have to look at conflicts and reclaim space... still figuring this out
    let left = 0;
    let right = 0;
    let width = 0;
    let newline = false;
    let conflictReducer = 0;
    const updates: { event: AgendaEvent; left: number; right: number }[] = [];
    eventsSortedByDuration.forEach((e) => {
      if (newline) {
        // look for conflicts to figure out where they were laid out
        const conflictingEvents = timeslotWithEvents
          .filter((timelineslot) =>
            timelineslot.eventsInTimeslot.find(
              (tse) => tse.event.id === e.event.id
            )
          )
          .map((timelineslot) =>
            timelineslot.eventsInTimeslot.filter(
              (tse) => tse.event.id !== e.event.id
            )
          )
          .flat()
          .map((tse) => tse.event)
          .reduce(
            (u, i) => (u.includes(i) ? u : [...u, i]),
            [] as AgendaEvent[]
          );
        console.dir({ conflictingEvents });

        // // summing width of all previous conflicts to come up with new left starting position
        // let totalWidth = 0;
        // conflictingEvents.forEach((ce) => {
        //   const fce = updates.find((u) => u.event.id === ce.id);
        //   if (!fce) {
        //     throw new Error("Unable to find conflicting event's dimensions");
        //   }
        //   totalWidth += roundToNearestHundreth(100 - fce.right - fce.left);
        // });

        // left = totalWidth;

        // find right most element and flip measurement to create starting left position
        let shortestRight = 999;
        conflictingEvents.forEach((ce) => {
          const updatedEvent = updates.find((u) => (u.event.id = ce.id));
          if (!updatedEvent) {
            throw new Error(
              "Unable to determine starting point for new line. Missing conflicting event in updates array"
            );
          }
          shortestRight =
            shortestRight < updatedEvent.right
              ? shortestRight
              : updatedEvent.right;
        });
        console.log({ shortestRight });
        left = 100 - shortestRight;
        // since some of the conflicts were already taken into account, we need to remove them later on when performing math on conflict counts
        conflictReducer = conflictingEvents.length;
        newline = false;
      }

      const conflictCount = eventsSortedByConflictCount.find(
        (event) => event.event.id === e.event.id
      )?.maxConflictCount;

      if (conflictCount === undefined) {
        throw new Error("Unable to find event conflict count");
      }

      let update;
      if (conflictCount === 0) {
        left = 0;
        right = 0;
        width = 0;
        //reset newline since we reset to left = 0
        newline = false;
        update = {
          event: e.event,
          left,
          right,
        };
      } else {
        width = roundToNearestHundreth(
          100 / (conflictCount + 1 - conflictReducer)
        );
        right = roundToNearestHundreth(100 - left - width);

        // prevent out of bounds
        if (right < 0) {
          right = 0;
          newline = true;
        }
        update = {
          event: e.event,
          left,
          right,
        };
      }

      left += width;

      //prevent out of bounds, start new line
      if (left >= 100) {
        left = 0;
        newline = true;
      }
      console.dir({ id: e.event.id, update });
      updates.push(update);
    });

    // find elements with the least conflict count
    setEvents((prev) => {
      return prev.map((prevEvent) => ({
        ...prevEvent,
        left:
          updates.find((update) => update.event.id === prevEvent.id)?.left ?? 0,
        right:
          updates.find((update) => update.event.id === prevEvent.id)?.right ??
          0,
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
