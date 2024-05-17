import redis from './redis';
import { getDate } from './utils';

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
}
