import { GLSL_COLOR } from "./shader-color";

/**
 * Aurora: three layers of light curtains. Each curtain has a bright, sharp lower edge that wanders
 * along an fbm curve, folds sideways (x is warped by noise) and fades upward through the palette.
 * Vertical "rays" come from noise stretched along y. Light is accumulated in linear RGB and written
 * as premultiplied alpha, so the aurora composites over any background — luminous on dark,
 * watercolour-like on light. Optional stars twinkle behind it on dark backgrounds.
 */
export const AURORA_FRAG = /* glsl */ `
uniform vec3 u_low;   // lower edge colour (linear RGB)
uniform vec3 u_mid;
uniform vec3 u_high;  // upper fringe colour
uniform float u_intensity;
uniform float u_stars;
uniform float u_light; // 1 when the background is light

${GLSL_COLOR}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x),
             mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}

vec3 curtain(vec2 uv, float aspect, float t, float i) {
  float x = uv.x * aspect;
  // Folds: warp x by slow noise so the ribbon bends like fabric.
  float fold = fbm(vec2(x * 0.7 + i * 3.1, t * 0.1 + i * 2.0)) - 0.5;
  float xw = x + fold * 1.1;
  // The lower edge snakes across the sky.
  float edge = 0.42 + 0.09 * i
    + 0.26 * (fbm(vec2(xw * 0.9 - t * 0.05 + i * 7.3, i * 1.7)) - 0.5)
    + 0.04 * sin(xw * 2.3 + t * 0.15 + i * 2.0);
  float d = uv.y - edge;
  // Ribbons break up along their length, leaving dark sky between them.
  float seg = smoothstep(0.3, 0.56, fbm(vec2(xw * 0.45 + i * 5.3 + t * 0.03, i * 3.3)));
  // Rays: noise stretched vertically, drifting along the ribbon; they also set each ray's height.
  float rays = fbm(vec2(xw * 16.0 + t * 0.3 * (1.0 + i * 0.3), uv.y * 0.5 - t * 0.04));
  rays = smoothstep(0.2, 0.8, rays);
  float height = 0.06 + 0.16 * rays * (1.0 - i * 0.25);
  float body = smoothstep(-0.008, 0.012, d) * exp(-max(d, 0.0) / height);
  float rim = exp(-abs(d) * 70.0) * 0.35; // the bright, crisp lower edge
  float a = (body * (0.45 + 0.75 * rays) + rim) * seg * (1.0 - i * 0.25);
  vec3 c = mix(u_low, u_mid, smoothstep(0.0, 0.08, d));
  c = mix(c, u_high, smoothstep(0.06, 0.24, d));
  return c * a;
}

void main() {
  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float t = u_time;

  vec3 light = vec3(0.0);
  for (int i = 0; i < 3; i++) light += curtain(uv, aspect, t, float(i));
  light *= u_intensity * 1.2;

  // Stars on dark backgrounds, hidden behind bright curtains.
  float stars = 0.0;
  if (u_stars > 0.0) {
    vec2 g = gl_FragCoord.xy / 3.0;
    vec2 cell = floor(g);
    float h = hash12(cell);
    if (h > 0.992) {
      vec2 o = vec2(hash12(cell + 3.1), hash12(cell + 7.7));
      float dd = length(fract(g) - o);
      float tw = 0.6 + 0.4 * sin(t * (1.0 + h * 3.0) + h * 40.0);
      stars = smoothstep(0.5, 0.0, dd) * tw * (h - 0.992) * 110.0 * smoothstep(0.15, 0.9, uv.y);
    }
    stars *= u_stars * (1.0 - u_light) * (1.0 - clamp(dot(light, vec3(1.0)), 0.0, 1.0));
  }
  light += vec3(stars) * 0.8;

  // Light → premultiplied colour. On light backgrounds deepen the colour so it reads as a wash.
  float peak = max(light.r, max(light.g, light.b));
  float a = clamp(1.0 - exp(-peak * mix(1.8, 2.4, u_light)), 0.0, 1.0);
  vec3 c = peak > 0.0 ? light / peak : vec3(0.0);
  vec3 wash = mix(vec3(dot(c, vec3(0.2126, 0.7152, 0.0722))), c, 0.62) * 0.62;
  c = mix(c, wash, u_light);
  vec3 premul = linearToSrgb(c) * a;
  premul += (ign(gl_FragCoord.xy) - 0.5) / 255.0 * a;
  fragColor = vec4(premul, a);
}
`;
