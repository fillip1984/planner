export type Event = {
  id: string;
  start: Date;
  end: Date;
  description: string;
};

export type Timeslot = {
  hour: number; // 00 - 23
  top: number;
  bottom: number;
};
