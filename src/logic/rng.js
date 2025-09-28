export const mulberry32 = (seed) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

export const createRng = (seed) => {
  const rand = mulberry32(seed);
  return {
    next: () => rand(),
    chance: (probability) => rand() < probability,
    between: (min, max) => min + rand() * (max - min),
  };
};
