export type Event = {
  id: string;
  start: Date;
  end: Date;
  description: string;
};

export type AgendaPosition = {
  startX: number;
  endX: number;
};

export type AgendaEvent = Event & AgendaPosition;

export type Timeslot = {
  hour: number; // 00 - 23
  date: Date;
  top: number;
  bottom: number;
};
