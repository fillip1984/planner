export type Event = {
  id: string;
  start: Date;
  end: Date;
  description: string;
};

export type AgendaPosition = {
  left: number; // 0 = left most, 100 = right most
  right: number; // 100 = left most, 0 right most
};

export type AgendaEvent = Event & AgendaPosition;

export type Timeslot = {
  hour: number; // 00 - 23
  date: Date;
  top: number;
  bottom: number;
};
