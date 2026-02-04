// Generate random width value outside component to avoid impure function during render
let skeletonWidthSeed = 0;

export function getNextSkeletonWidth(): string {
  skeletonWidthSeed = (skeletonWidthSeed + 1) % 40;
  return `${skeletonWidthSeed + 50}%`;
}
