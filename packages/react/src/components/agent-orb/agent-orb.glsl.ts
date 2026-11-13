import { GLSL_COLOR } from "../../lib/shader-color";

/**
 * The agent orb: a sphere drawn as a halftone. There is no surface and no light bloom, only dots
 * on a square grid whose size says how bright that part of the ball is. Per pixel we
 *   1. find the grid cell and the sphere normal at the cell's centre,
 *   2. sample one slow field of 3D simplex noise on the sphere surface (so it turns like a globe)
 *      and a soft light from the top left (so it has volume),
 *   3. add what the agent is doing: a bright band orbiting while it thinks, rings travelling out
 *      from the centre with the voice, a slow breath when idle,
 *   4. turn that into a dot radius and draw the dot, antialiased, in one ink.
 * Written as premultiplied alpha, so it sits on any surface.
 */
export const AGENT_ORB_FRAG = /* glsl */ `
uniform vec3 u_ink;      // linear RGB of the dots
uniform float u_cells;   // dots across the diameter
uniform float u_energy;  // 0–1 how full the dots run
uniform float u_swirl;   // 0–1 strength of the orbiting band (thinking)
uniform float u_spin;    // integrated orbit angle
uniform float u_phase;   // integrated flow time
uniform float u_level;   // smoothed audio level 0–1
uniform float u_breath;  // 0–1 idle breathing amplitude

${GLSL_COLOR}

vec4 permute4(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute4(permute4(permute4(
    i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

void main() {
  // Work in device pixels, on a grid snapped to them: the pitch is a whole number of pixels and
  // every dot centre has the same sub-pixel offset, so dots of one size render identically.
  float s = min(u_resolution.x, u_resolution.y);
  const float R = 0.94;
  float pitch = max(2.0, floor(R * s / u_cells));
  float radius = 0.5 * pitch * u_cells;
  vec2 origin = floor(0.5 * u_resolution);
  // An odd count puts a dot on the centre; an even count puts the centre between four.
  float odd = 0.5 * mod(u_cells, 2.0);
  vec2 g = (gl_FragCoord.xy - origin) / pitch + odd;
  vec2 cell = floor(g) + 0.5;
  vec2 c = (cell - odd) * pitch;
  float rc = length(c) / radius;
  float a = 0.0;
  if (rc < 1.0) {
    float z = sqrt(1.0 - rc * rc);
    vec3 n = vec3(c / radius, z);

    // The field lives on the surface and turns with the ball.
    vec3 P = n;
    P.xz = rot(u_phase * 0.2) * P.xz;
    float field = snoise(P * 1.2 + vec3(0.0, u_phase * 0.11, 0.0)) * 0.5 + 0.5;
    float lit = dot(n, normalize(vec3(-0.5, 0.55, 0.67))) * 0.5 + 0.5;

    // Thinking: one bright band orbits, the same motion as a running status glyph.
    float band = pow(0.5 + 0.5 * cos(atan(c.y, c.x) - u_spin), 3.0) * smoothstep(0.1, 0.85, rc);
    // Voice: rings travel outward from the centre.
    float wave = 0.5 + 0.5 * sin(rc * 8.0 - u_phase * 5.0);

    float v = mix(lit, field, 0.55) * (0.42 + 0.58 * u_energy);
    v += u_swirl * band * 0.6;
    v += u_level * (0.2 + 0.5 * wave);
    v *= 1.0 + 0.1 * u_breath * sin(u_time * 1.3);
    // Dots shrink toward the limb, the way a halftone fades out.
    v *= 0.4 + 0.6 * smoothstep(1.0, 0.6, rc);

    // Radius in pixels, never under one pixel across, with a one-pixel antialiased edge.
    float rad = max(0.6, mix(0.06, 0.45, clamp(v, 0.0, 1.0)) * pitch);
    a = clamp(rad - length(g - cell) * pitch + 0.5, 0.0, 1.0);
  }
  fragColor = vec4(linearToSrgb(u_ink) * a, a);
}
`;
