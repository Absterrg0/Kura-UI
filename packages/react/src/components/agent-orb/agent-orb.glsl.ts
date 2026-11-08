import { GLSL_COLOR } from "../../lib/shader-color";

/**
 * The agent orb: an analytic sphere (no geometry) of sumi ink suspended in water, with an ember
 * of shu (vermilion) burning inside it. Per pixel we
 *   1. find the (audio-deformed) silhouette and the sphere normal,
 *   2. march the view ray 5 steps through a domain-warped 3D noise volume — ink clouds diffusing
 *      in water, twisted around the view axis for the thinking swirl,
 *   3. shade it like ink, not glass: dense sumi masses with a darker pooled edge where they meet
 *      the pale wash, fine wash filaments, matte wrap light and a hairline paper-coloured rim,
 *   4. let the ember glow through wherever the ink thins; it swells with the voice,
 *   5. outside the sphere, print a halftone halo — a grid of shu dots that swell toward the rim,
 *      like the dithered suns in Kurambit's illustrations — and, while thinking, a turning ensō
 *      brush stroke with dry-brush bristle streaks.
 * Lighting happens in linear RGB; one sRGB encode + IGN dither at the end, premultiplied alpha.
 */
export const AGENT_ORB_FRAG = /* glsl */ `
uniform vec3 u_deep;     // dense ink
uniform vec3 u_mid;      // wash
uniform vec3 u_bright;   // ember / halftone dots
uniform vec3 u_glint;    // rim light, ensō on dark
uniform float u_energy;  // 0–1 ember strength and turbulence
uniform float u_swirl;   // 0–1 vortex strength (also brings in the ensō)
uniform float u_spin;    // integrated vortex angle
uniform float u_phase;   // integrated flow time
uniform float u_level;   // smoothed audio level 0–1
uniform float u_breath;  // 0–1 idle breathing amplitude
uniform float u_halo;    // 0–1 halftone halo
uniform float u_light;   // 1 on light backgrounds, 0 on dark

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

float fbm(vec3 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * snoise(p); p = p * 2.03 + 11.7; a *= 0.5; }
  return v;
}

const float TAU = 6.28318530718;

void main() {
  float s = min(u_resolution.x, u_resolution.y);
  float px = 2.0 / s;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) * px;
  float t = u_phase;

  // Silhouette: breathing + audio-driven wobble along the rim.
  float R = 0.66 * (1.0 + 0.022 * u_breath * sin(u_time * 1.55) + 0.075 * u_level);
  float r = length(p);
  vec2 dir = r > 0.0 ? p / r : vec2(0.0, 1.0);
  float wob = snoise(vec3(dir * 1.2, t * 0.55)) * (0.006 + 0.03 * u_level)
            + snoise(vec3(dir * 2.6, t * 1.4 + 3.0)) * 0.014 * u_level;
  float edge = R * (1.0 + wob);
  float mask = smoothstep(edge + px * 1.1, edge - px * 1.1, r);

  vec3 col = vec3(0.0);
  if (mask > 0.0) {
    vec2 q = p / edge;
    float z = sqrt(max(0.0, 1.0 - dot(q, q)));
    vec3 n = normalize(vec3(q, z));
    vec3 L = normalize(vec3(-0.5, 0.62, 0.6));

    // Ink diffusing in water: slow, large masses, twisted into a vortex while thinking.
    vec3 rd = refract(vec3(0.0, 0.0, -1.0), n, 0.8);
    vec3 ro = vec3(q, z);
    float chord = 1.4 * z + 0.3;
    float dens = 0.0;
    float rib = 0.0;
    for (int k = 0; k < 5; k++) {
      float fk = (float(k) + 0.5) / 5.0;
      vec3 P = ro + rd * chord * fk;
      float rr = length(P.xy);
      P.xy = rot(u_spin * (1.0 - 0.5 * rr) + u_swirl * 2.4 * (1.0 - rr)) * P.xy;
      vec3 w = P * 0.78 + vec3(0.0, -t * 0.16, t * 0.28);
      vec3 warp = vec3(snoise(w * 0.7 + t * 0.12), snoise(w * 0.7 + 7.3), snoise(w * 0.7 - 4.1 - t * 0.1));
      float d = fbm(w + warp * (0.55 + 0.5 * u_energy));
      dens += smoothstep(-0.35, 0.4, d) * (1.0 - fk * 0.35);
      rib += pow(1.0 - abs(snoise(w * 1.4 + warp)), 7.0) * (1.0 - fk * 0.6);
    }
    dens /= 4.1;
    rib /= 3.8;

    // Sumi: dense ink over a pale wash, with a darker pooled line where the two meet, and fine
    // wash filaments where the ink thins.
    float ink = pow(smoothstep(0.04, 0.74, dens), 0.55);
    float pool = exp(-pow((dens - 0.22) * 10.0, 2.0));
    vec3 body = mix(u_mid, u_deep, ink);
    body = mix(body, u_deep, pool * 0.3 * (1.0 - ink));
    body = mix(body, mix(u_mid, u_glint, 0.25), rib * (1.0 - ink) * 0.3);

    // Matte light: soft wrap and a gentle limb darkening. No gloss, no specular.
    float diff = clamp(dot(n, L) * 0.5 + 0.5, 0.0, 1.0);
    col = body * mix(0.8, 1.06, diff) * mix(0.84, 1.0, sqrt(z));

    // Ember: shu light deep inside, glowing through wherever the ink is thin.
    vec2 cp = q - vec2(0.06, -0.1);
    float core = exp(-dot(cp, cp) * (6.5 - 3.0 * u_level));
    float ember = core * (0.12 + 0.65 * u_energy + 0.8 * u_level) * mix(1.0, 0.5, ink);
    // Blend in OKLab-ish terms: lift toward the ember without passing through grey-brown.
    col = mix(col, u_bright, smoothstep(0.0, 1.0, clamp(ember, 0.0, 0.95)));
    col += u_bright * exp(-dot(cp, cp) * 2.2) * (0.02 + 0.1 * u_energy + 0.2 * u_level);
    col += u_bright * rib * core * (0.03 + 0.2 * u_energy + 0.35 * u_level);
    // The ember bleeds toward the lower rim, away from the light.
    float sss = pow(1.0 - z, 1.8) * smoothstep(0.2, -0.9, q.y + q.x * 0.35);
    col = mix(col, u_bright, clamp(sss * (0.02 + 0.12 * u_energy + 0.3 * u_level), 0.0, 1.0));

    // A hairline of paper-coloured light on the rim, brighter on the lit side.
    float fres = pow(1.0 - z, 6.0);
    float lit = 0.55 + 0.45 * smoothstep(-0.4, 0.9, dot(normalize(q + 1e-4), normalize(L.xy)));
    col = mix(col, u_glint, fres * 0.32 * lit);
  }

  // Halftone halo: a square grid of dots that swell toward the rim, printed in the ember colour.
  float cell = max(4.0, s / 50.0);
  vec2 cc = (floor(gl_FragCoord.xy / cell) + 0.5) * cell;
  float cr = length((cc - 0.5 * u_resolution) * px);
  float co = cr - R * 1.07;
  float strength = co > 0.0 ? u_halo * exp(-co * 6.0) * smoothstep(0.32, 0.03, co) : 0.0;
  float rad = 0.5 * cell * sqrt(clamp(strength, 0.0, 0.6));
  float dpx = length(gl_FragCoord.xy - cc);
  float dotA = smoothstep(rad + 0.65, rad - 0.65, dpx) * smoothstep(0.35, 1.0, rad);
  float haloA = dotA * mix(0.9, 0.95, u_light);

  // Ensō: one open brush circle turning around the orb while it thinks. It lands heavy, thins
  // out and breaks into dry-brush streaks toward the tail.
  float ensoAmt = smoothstep(0.35, 0.8, u_swirl);
  float ensoA = 0.0;
  if (ensoAmt > 0.0) {
    float er = R * 1.24;
    float th = atan(p.y, p.x);
    float u = mod(th + u_spin * 1.3, TAU) / (TAU * 0.82);
    if (u < 1.0) {
      float pressure = smoothstep(0.0, 0.035, u) * mix(1.0, 0.25, smoothstep(0.35, 1.0, u));
      float w = 0.05 * pressure + 0.003;
      float rr = er * (1.0 + 0.018 * sin(u * 7.0 + 1.3) - 0.03 * u);
      float d = r - rr;
      float stroke = smoothstep(w + px, w - px, abs(d));
      float across = d / max(w, 1e-3);
      float bristle = snoise(vec3(across * 5.0, u * 2.4, 3.7)) * 0.6
                    + snoise(vec3(across * 11.0, u * 5.0, 8.1)) * 0.4;
      float dry = smoothstep(0.25, 1.0, u);
      stroke *= smoothstep(-0.25, 0.15, bristle + 0.75 - dry * 1.4);
      ensoA = stroke * ensoAmt * mix(0.5, 0.62, u_light);
    }
  }

  vec3 orb = linearToSrgb(col);
  vec3 dotC = linearToSrgb(u_bright);
  vec3 ensoC = linearToSrgb(mix(u_glint, mix(u_deep, u_mid, 0.35), u_light));
  // Back to front: halftone dots, ensō, sphere. Premultiplied alpha.
  vec3 premul = dotC * haloA;
  float a = haloA;
  premul = ensoC * ensoA + premul * (1.0 - ensoA);
  a = ensoA + a * (1.0 - ensoA);
  premul = orb * mask + premul * (1.0 - mask);
  a = mask + a * (1.0 - mask);
  premul += (ign(gl_FragCoord.xy) - 0.5) / 255.0 * a;
  fragColor = vec4(premul, a);
}
`;
