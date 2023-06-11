import { setTimeout } from 'timers/promises';

export const waitAndRetry = async (
  time: number,
  delay: number,
  cb: Function,
) => {
  for (const iterator of [...Array(time).keys()]) {
    await setTimeout(delay);

    try {
      const result = await cb();
      return result;
    } catch (error) {}
  }
};
