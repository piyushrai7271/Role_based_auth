import { LOCK_TIME, MAX_LOGIN_ATTEMPTS } from "../config/constant.js";
import redisClient from "../config/redis.js";

const getLockKeys = (email) => ({
  lockKey: `login:lock:${email}`,
  failKey: `login:fail:${email}`,
});

const isAccountLocked = async (email) => {
  const { lockKey } = getLockKeys(email);
  return await redisClient.get(lockKey);
};

const recordFailedAttempt = async (email) => {
  const { lockKey, failKey } = getLockKeys(email);

  const attempts = await redisClient.incr(failKey);

  if (attempts === 1) {
    await redisClient.expire(failKey, LOCK_TIME);
  }

  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    await redisClient.set(lockKey, "1", { EX: LOCK_TIME });
    await redisClient.del(failKey);
    return true; // account locked
  }

  return false;
};

const clearLoginAttempts = async (email) => {
  const { lockKey, failKey } = getLockKeys(email);
  await redisClient.del(lockKey);
  await redisClient.del(failKey);
};

export { isAccountLocked, recordFailedAttempt, clearLoginAttempts };
