import IOredis from 'ioredis';


const redis = new IOredis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  
});
export default redis;
