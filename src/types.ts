export type Event = {
  start: Date;
  end: Date;
  duration: number;
  description: string;
};

export type Timeslot = {
  hour: number; // 00 - 23
  top: number;
  bottom: number;
};
