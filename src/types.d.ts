type InsyteArgs = {
  opts: {
    retention: number;
  };
  track: {
    name: string;
    event: {
      [key: string]: string | any;
    };
    persist: boolean;
  };
  retrieve: {
    name: string;
    date: string;
  };
  retrieveDays: {
    name: string;
    nDays: number;
  };
};

type InsyteRetrieveResult = {
  date: string;
  event: Record<string, number>[];
};
