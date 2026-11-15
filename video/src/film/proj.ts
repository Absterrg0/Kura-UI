/**
 * A pinhole camera for the dot shots. Dots are drawn as SVG circles at their projected position and
 * size, so a macro of one dot is as crisp as a wide of a thousand (CSS 3D would upscale a raster).
 */
export type V3 = { x: number; y: number; z: number };
export type Cam = {
  /** World point the camera looks at. */
  tx: number;
  ty: number;
  tz: number;
  /** Distance from the target; at `dist === FOCAL` one world px is one screen px. */
  dist: number;
  /** Orbit, degrees: yaw turns about the vertical, pitch tips the world back, roll spins the view. */
  yaw?: number;
  pitch?: number;
  roll?: number;
  /** Where the target lands on screen. Default the centre of the frame. */
  sx?: number;
  sy?: number;
};
export type P2 = { x: number; y: number; s: number; z: number; visible: boolean };

export const FOCAL = 1400;
/**
 * Anything closer to the lens than a quarter of the camera's distance to its target is culled: a
 * dot passing the camera must not fill the frame (relative, so a macro still sees its subject).
 */
export const NEAR = 0.25;
const rad = (d: number) => (d * Math.PI) / 180;

export function camera(c: Cam) {
  const cy = Math.cos(rad(c.yaw ?? 0));
  const sy = Math.sin(rad(c.yaw ?? 0));
  const cp = Math.cos(rad(c.pitch ?? 0));
  const sp = Math.sin(rad(c.pitch ?? 0));
  const cr = Math.cos(rad(c.roll ?? 0));
  const sr = Math.sin(rad(c.roll ?? 0));
  const ox = c.sx ?? 960;
  const oy = c.sy ?? 540;
  return (p: V3): P2 => {
    const x0 = p.x - c.tx;
    const y0 = p.y - c.ty;
    const z0 = p.z - c.tz;
    // yaw (about y)
    const x1 = x0 * cy + z0 * sy;
    const z1 = -x0 * sy + z0 * cy;
    // pitch (about x): positive tips the top of the world away from the camera
    const y2 = y0 * cp - z1 * sp;
    const z2 = y0 * sp + z1 * cp;
    // roll (about the view axis)
    const x3 = x1 * cr - y2 * sr;
    const y3 = x1 * sr + y2 * cr;
    const depth = c.dist + z2;
    const s = depth > 1 ? FOCAL / depth : 0;
    return { x: ox + x3 * s, y: oy + y3 * s, s, z: depth, visible: depth > NEAR * c.dist };
  };
}

/** Interpolates two cameras field by field (distance in log space, so zooms feel even). */
export function lerpCam(a: Cam, b: Cam, t: number): Cam {
  const m = (u: number | undefined, v: number | undefined, d = 0) =>
    (u ?? d) + ((v ?? d) - (u ?? d)) * t;
  return {
    tx: m(a.tx, b.tx),
    ty: m(a.ty, b.ty),
    tz: m(a.tz, b.tz),
    dist: Math.exp(Math.log(a.dist) + (Math.log(b.dist) - Math.log(a.dist)) * t),
    yaw: m(a.yaw, b.yaw),
    pitch: m(a.pitch, b.pitch),
    roll: m(a.roll, b.roll),
    sx: m(a.sx, b.sx, 960),
    sy: m(a.sy, b.sy, 540),
  };
}

/**
 * A disc of radius r lying in a world plane (spanned by unit vectors u and v), as an SVG circle
 * with an affine transform: the exact projected ellipse to first order, so dots on a tilted page
 * flatten the way they should.
 */
export function discMatrix(
  project: (p: V3) => P2,
  c: V3,
  r: number,
  u: V3 = { x: 1, y: 0, z: 0 },
  v: V3 = { x: 0, y: 1, z: 0 },
) {
  const p = project(c);
  const a = project({ x: c.x + u.x * r, y: c.y + u.y * r, z: c.z + u.z * r });
  const b = project({ x: c.x + v.x * r, y: c.y + v.y * r, z: c.z + v.z * r });
  return {
    p,
    visible: p.visible && a.visible && b.visible,
    matrix: `matrix(${a.x - p.x} ${a.y - p.y} ${b.x - p.x} ${b.y - p.y} ${p.x} ${p.y})`,
  };
}
