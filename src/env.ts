import * as z from 'zod';
import { createEnv } from '@t3-oss/env-core/dist';

const env = createEnv({
  clientPrefix: 'PUBLIC_',
  server: {
    REDIS_URL: z.string().url(),
    REDIS_TOKEN: z.string().min(1),
  },
  client: {},
  runtimeEnv: process.env,
});

export default env;
