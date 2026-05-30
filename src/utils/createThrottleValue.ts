const createThrottleValue = <T>(
  initial: T,
  ms = 500,
  callback: CallableFunction = () => {},
) => {
  let value = initial;
  let last = Date.now();

  return {
    get: () => value,
    set: (next: T) => {
      if (Date.now() - last >= ms) {
        value = next;
        last = Date.now();
        callback();
        return true;
      }
      return false;
    },
  };
};

export default createThrottleValue;
