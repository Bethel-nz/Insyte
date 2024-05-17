import redis from './redis';
import { getDate } from './utils';
import { parse } from 'date-fns';

/**
 * Represents the Insyte class.
 *
 * The Insyte class is responsible for tracking event and storing them in Insyte.
 *
 * @param {number} retention - The retention period for the tracked event in seconds. Defaults to 604800 seconds (7 days).
 *
 * @method track - Tracks an event and stores it in Insyte.
 * @param {string} name - The name of the event.
 * @param {object} event - The event data, which is extensible and can include mandatory 'page' and optional 'country' fields, along with any additional key-value pairs of items to be tracked.
 * @param {boolean} persist - Determines whether to persist the event or not. Defaults to false.
 * @returns {Promise<void>} - A promise that resolves when the event is tracked successfully.
 *
 * @throws {Error} - If there is an error while tracking the event in Insyte.
 * @example
 * const insyte = new Insyte();
 * insyte.track({
 *   name: 'page-view',
 *   event: { page: '/', country: req.geo?.country },
 *   });
 *
 * @method retrieve - Retrieves data for a specific date from Insyte.
 * @param name - The name of the event to retrieve data for.
 * @param date - The date for which to retrieve data.
 * @returns {Promise<InsyteRetrieveResult>} A Promise that resolves to the retrieved data for the specified date.
 * @throws {Error} If there is an error retrieving the data.
 *
 * @method retrieveDays -  Retrieves data for multiple days from Insyte.
 * @param name - The name of the event to retrieve data for.
 * @param nDays - The number of days to retrieve data for.
 * @returns {Promise<InsyteRetrieveResult[]>} A Promise that resolves to an array of retrieved data for each day, sorted in ascending order by date.
 * @throws If there is an error retrieving the data.
 *
 */
export default class Insyte {
  private retention: number = 60 * 60 * 24 * 7;
  constructor(opts?: InsyteArgs['opts']) {
    if (opts?.retention) this.retention = opts.retention;
  }
  async track({ name, event, persist }: InsyteArgs['track']): Promise<void> {
    try {
      let key = `insyte::${name}`;
      const field = JSON.stringify({ event });

      if (!persist) {
        key += `::${getDate()}`;
        await redis.expire(key, this.retention);
      }
      await redis.hincrby(key, field, 1);
    } catch (error) {
      console.error('Failed to track event in Insyte:', error);
      throw error;
    }
  }

  async retrieve({
    name,
    date,
  }: InsyteArgs['retrieve']): Promise<InsyteRetrieveResult> {
    try {
      const key = `insyte::${name}::${date}`;
      const data = await redis.hgetall<Record<string, string>>(key);

      return {
        date,
        event: Object.entries(data ?? []).map(
          ([key, value]: [key: string, value: string]) =>
            ({
              [key]: Number(value),
            } as Record<string, number>)
        ),
      };
    } catch (error) {
      console.error('Failed to retrieve data from Insyte:', error);
      throw error;
    }
  }

  async retrieveDays({ name, nDays = 1 }: InsyteArgs['retrieveDays']) {
    const promises: ReturnType<typeof this.retrieve>[] = [];

    for (let i = 0; i < nDays; i++) {
      const date = getDate(i);
      const promise = this.retrieve({ name, date });
      promises.push(promise);
    }

    try {
      const resolvedData = await Promise.all(promises);
      const data = resolvedData.sort((a, b) =>
        parse(a.date, 'dd/MM/yyyy', new Date()) >
        parse(b.date, 'dd/MM/yyyy', new Date())
          ? 1
          : -1
      );

      return data;
    } catch (error) {
      console.log('Failed to retrieve Days from Insyte:', error);
      throw error;
    }
  }
}

/**
usage: 
import { NextRequest, NextResponse, userAgent } from 'next/server';
import Insyte from '@/Insyte';

const insyte = new Insyte();


export default function middleware(req: NextRequest) {
  const agent = userAgent(req);
  if (
    req.nextUrl.pathname.includes('/_next/static') ||
    req.nextUrl.pathname === '/favicon.ico' ||
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('api')
  ) {
    return NextResponse.next();
  }
  try {
    insyte.track({
      name: 'page-view',
      event: {
        page: req.nextUrl.pathname,
        country: req.geo?.country,
        device:
          agent.device.type === 'mobile'
            ? 'mobile'
            : agent.device.type === 'undefined'
            ? 'unknown'
            : 'desktop',
        os: agent.os.name,
      },
      persist: false,
    });
  } catch (error) {
    console.error(error);
  }

  return NextResponse.next();
}

*/
