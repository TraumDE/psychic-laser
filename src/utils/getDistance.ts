const getDistance = (
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number },
) => {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y, p1.z - p2.z);
};

export default getDistance;
