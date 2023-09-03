import {
  areIntervalsOverlapping,
  eachHourOfInterval,
  endOfDay,
  format,
  getHours,
  intervalToDuration,
  parse,
  startOfDay,
} from "date-fns";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import EventCard, { type widthPositionType } from "~/components/EventCard";
import { type Event, type Timeslot } from "~/types";

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
      start: parse("2023-08-26 02:00", "yyyy-MM-dd HH:mm", new Date()),
      end: parse("2023-08-26 04:00", "yyyy-MM-dd HH:mm", new Date()),
      description: "Second",
    },
    // {
    //   id: "2",
    //   start: parse("2023-08-26 02:00", "yyyy-MM-dd HH:mm", new Date()),
    //   end: parse("2023-08-26 06:00", "yyyy-MM-dd HH:mm", new Date()),
    //   description: "Third",
    // },
    // {
    //   id: "3",
    //   start: parse("2023-08-26 02:00", "yyyy-MM-dd HH:mm", new Date()),
    //   end: parse("2023-08-26 05:00", "yyyy-MM-dd HH:mm", new Date()),
    //   description: "Fourth",
    // },
    // {
    //   id: "4",
    //   start: parse("2023-08-26 02:00", "yyyy-MM-dd HH:mm", new Date()),
    //   end: parse("2023-08-26 08:00", "yyyy-MM-dd HH:mm", new Date()),
    //   description: "First",
    // },
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

  const calculateWidthPosition = (event: Event): widthPositionType => {
    //check how many collisions with all events it has
    const eventAndInterval = {
      event,
      interval: { start: event.start, end: event.end },
    };
    const allEventIntervals = events.map((allEvent) => {
      return {
        event: allEvent,
        interval: { start: allEvent.start, end: allEvent.end },
      };
    });

    const collisions = allEventIntervals.filter((otherEventAndInterval) =>
      areIntervalsOverlapping(
        eventAndInterval.interval,
        otherEventAndInterval.interval
      )
    );

    //sort collisions by duration (the longer the higher the priority)
    collisions.sort((eventAndInterval1, eventAndInterval2) => {
      const dur1 = intervalToDuration(eventAndInterval1.interval);
      const dur2 = intervalToDuration(eventAndInterval2.interval);
      if (dur1.hours && dur2.hours) {
        const hourDifference = dur2.hours - dur1.hours;
        if (hourDifference !== 0) {
          return hourDifference;
        }
        // order breaker is id sorted numberic or alpha
        return eventAndInterval1.event.id.localeCompare(
          eventAndInterval2.event.id
        );
      }
      throw new Error("Unable to compare, not enough hours");
    });

    if (collisions.length === 1) {
      return "full";
    }

    if (collisions.length === 2) {
      return collisions.findIndex(
        (i) => i.event.id === eventAndInterval.event.id
      ) === 0
        ? "firstOf2"
        : "secondOf2";
    }

    if (collisions.length === 3) {
      const index = collisions.findIndex(
        (i) => i.event.id === eventAndInterval.event.id
      );
      if (index === 0) {
        return "firstOf3";
      }

      if (index === 1) {
        return "secondOf3";
      }

      return "thirdOf3";
    }

    if (collisions.length === 4) {
      const index = collisions.findIndex(
        (i) => i.event.id === eventAndInterval.event.id
      );
      if (index === 0) {
        return "firstOf4";
      }

      if (index === 1) {
        return "secondOf4";
      }

      if (index === 2) {
        return "thirdOf4";
      }

      return "fourthOf4";
    }

    throw new Error(
      "Unable to determine width position for event: " + event.id
    );
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
