import { GLSL_COLOR } from "./shader-color";

/** Max colours the shader blends. */
export const MAX_COLORS = 6;

/**
 * Mesh gradient: up to six colour "wells" drift on slow Lissajous paths; every pixel blends them
 * in OKLab with inverse-distance weights (smooth, even, no muddy midpoints). The sample position
 * is domain-warped by simplex noise (distortion), twisted around the centre (swirl) and lensed
 * toward the pointer. Output is converted to sRGB once, with film grain and IGN dithering.
 */
export const MESH_GRADIENT_FRAG = /* glsl */ `
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
uniform vec3 u_c4;
uniform vec3 u_c5;
uniform float u_count;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_grain;
uniform float u_seed;
uniform vec3 u_mouse; // xy in 0–1 (y up), z = influence 0–1

${GLSL_COLOR}

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 colorAt(int i) {
  if (i == 0) return u_c0;
  if (i == 1) return u_c1;
  if (i == 2) return u_c2;
  if (i == 3) return u_c3;
  if (i == 4) return u_c4;
  return u_c5;
}

// Each well orbits its own anchor on a slow, irrational Lissajous path.
vec2 wellAt(float i, float t, float aspect) {
  float a = i * 2.39996323 + u_seed * 1.7;
  float ring = 0.18 + 0.2 * fract(i * 0.618034 + u_seed * 0.13);
  vec2 anchor = vec2(0.5 * aspect, 0.5) + ring * vec2(cos(a) * aspect, sin(a)) * 1.35;
  vec2 drift = vec2(
    sin(t * (0.21 + 0.043 * i) + a * 1.7) * aspect,
    cos(t * (0.17 + 0.037 * i) + a * 2.3));
  return anchor + 0.2 * drift;
}

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 center = vec2(0.5 * aspect, 0.5);
  float t = u_time * 0.35 + u_seed * 10.0;

  // Pointer: a soft lens that pulls the colour field toward the cursor.
  vec2 m = vec2(u_mouse.x * aspect, u_mouse.y);
  vec2 dm = p - m;
  p -= dm * 0.22 * u_mouse.z * exp(-dot(dm, dm) * 7.0);

  // Distortion: low-frequency drifting simplex noise warps the sample position. A second, finer
  // octave adds silk-like folds without turning the field into smoke.
  vec2 q = p * 0.9;
  vec2 warp = vec2(
    snoise(q + vec2(t * 0.16, -t * 0.12)),
    snoise(q + vec2(5.2 - t * 0.13, 1.3 + t * 0.15)));
  warp += 0.28 * vec2(
    snoise(q * 1.9 + vec2(-t * 0.21, t * 0.18) + 3.7),
    snoise(q * 1.9 + vec2(t * 0.19, t * 0.23) + 8.1));
  p += u_distortion * 0.22 * warp;

  // Swirl: rotate around the centre, strongest near it, breathing slowly.
  vec2 c = p - center;
  float r = length(c);
  float ang = u_swirl * 1.8 * exp(-r * r * 3.0) * (0.8 + 0.2 * sin(t * 0.5));
  float cs = cos(ang), sn = sin(ang);
  p = center + mat2(cs, -sn, sn, cs) * c;

  // Inverse-distance blend in OKLab.
  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < ${MAX_COLORS}; i++) {
    if (float(i) >= u_count) break;
    vec2 d = p - wellAt(float(i), t, aspect);
    float w = 1.0 / pow(dot(d, d) + 0.025, 1.75);
    acc += colorAt(i) * w;
    wsum += w;
  }
  vec3 lab = acc / wsum;

  vec3 col = linearToSrgb(oklabToLinear(lab));

  // Film grain: luminance-only, refreshed ~24 fps, scaled down in the deepest shadows.
  float g = hash12(gl_FragCoord.xy + fract(floor(u_time * 24.0) * 0.1371) * 517.0) - 0.5;
  col += g * u_grain * 0.14 * (0.35 + 0.65 * lab.x);

  fragColor = vec4(dither(col), 1.0);
}
`;
