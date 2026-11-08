import { GLSL_COLOR } from "../../lib/shader-color";

/**
 * The agent orb: an analytic sphere (no geometry) shaded like thick glass holding a luminous
 * liquid. Per pixel we
 *   1. find the (audio-deformed) silhouette and the sphere normal,
 *   2. refract the view ray and march 5 steps through a domain-warped 3D noise volume — the
 *      "liquid", twisted around the view axis for the thinking swirl,
 *   3. add ridged-noise caustic filaments where light would focus (opposite the key light),
 *   4. light it: wrap diffuse, a fresnel rim, a soft window reflection and a tight specular,
 *   5. composite a faint halo outside the sphere, in premultiplied alpha.
 * All lighting happens in linear RGB; one sRGB encode + IGN dither at the end.
 */
export const AGENT_ORB_FRAG = /* glsl */ `
uniform vec3 u_deep;
uniform vec3 u_mid;
uniform vec3 u_bright;
uniform vec3 u_glint;
uniform float u_energy;  // 0–1 inner brightness and turbulence
uniform float u_swirl;   // 0–1 vortex strength
uniform float u_spin;    // integrated vortex angle
uniform float u_phase;   // integrated flow time
uniform float u_level;   // smoothed audio level 0–1
uniform float u_breath;  // 0–1 idle breathing amplitude
uniform float u_halo;    // 0–1 outer halo
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

void main() {
  float s = min(u_resolution.x, u_resolution.y);
  float px = 2.0 / s;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) * px;
  float t = u_phase;

  // Silhouette: breathing + audio-driven wobble along the rim.
  float R = 0.7 * (1.0 + 0.022 * u_breath * sin(u_time * 1.55) + 0.075 * u_level);
  float r = length(p);
  vec2 dir = r > 0.0 ? p / r : vec2(0.0, 1.0);
  float wob = snoise(vec3(dir * 1.2, t * 0.55)) * (0.006 + 0.03 * u_level)
            + snoise(vec3(dir * 2.6, t * 1.4 + 3.0)) * 0.014 * u_level;
  float edge = R * (1.0 + wob);
  float mask = smoothstep(edge + px * 1.2, edge - px * 1.2, r);

  vec3 col = vec3(0.0);
  if (mask > 0.0) {
    vec2 q = p / edge;
    float z = sqrt(max(0.0, 1.0 - dot(q, q)));
    vec3 n = normalize(vec3(q, z));
    vec3 L = normalize(vec3(-0.55, 0.65, 0.55));

    // March the refracted ray through the liquid: large, slow masses of colour (deep ↔ mid),
    // lit from within where the density is high.
    vec3 rd = refract(vec3(0.0, 0.0, -1.0), n, 0.72);
    vec3 ro = vec3(q, z);
    float chord = 1.5 * z + 0.3;
    float dens = 0.0;
    float rib = 0.0;
    for (int k = 0; k < 5; k++) {
      float fk = (float(k) + 0.5) / 5.0;
      vec3 P = ro + rd * chord * fk;
      // Vortex: twist around the view axis, faster toward the core.
      float rr = length(P.xy);
      P.xy = rot(u_spin * (1.0 - 0.5 * rr) + u_swirl * 2.4 * (1.0 - rr)) * P.xy;
      vec3 w = P * 0.95 + vec3(0.0, -t * 0.18, t * 0.3);
      vec3 warp = vec3(snoise(w * 0.7 + t * 0.12), snoise(w * 0.7 + 7.3), snoise(w * 0.7 - 4.1 - t * 0.1));
      float d = fbm(w + warp * (0.6 + 0.6 * u_energy));
      dens += smoothstep(-0.3, 0.45, d) * (1.0 - fk * 0.35);
      // Thin luminous threads that appear with energy.
      rib += pow(1.0 - abs(snoise(w * 1.3 + warp)), 6.0) * (1.0 - fk * 0.6);
    }
    dens /= 4.1;
    rib /= 3.8;

    // Volume: light travels further through the edges, so they absorb more.
    float thickness = sqrt(z);
    vec3 body = mix(u_deep, u_mid, dens);
    body = mix(body, u_bright, smoothstep(0.55, 1.0, dens) * (0.35 + 0.45 * u_energy));
    float diff = clamp(dot(n, L) * 0.5 + 0.5, 0.0, 1.0);
    col = body * mix(0.5, 1.12, diff) * mix(0.72, 1.0, thickness);

    // Core: a soft inner light, offset away from the key light, swelling with the voice.
    vec2 coreP = q - vec2(0.1, -0.16);
    float core = exp(-dot(coreP, coreP) * (3.2 - 1.2 * u_level));
    col += u_bright * core * (0.12 + 0.35 * u_energy + 0.5 * u_level);
    col += u_bright * rib * (0.03 + 0.22 * u_energy * u_energy + 0.25 * u_level);

    // Caustics: soft pools of focused light drifting opposite the key light.
    vec2 cq = rot(u_spin * 0.35) * q;
    float cn = snoise(vec3(cq * 2.6, t * 0.35)) * 0.6 + snoise(vec3(cq * 5.2 + 3.0, t * 0.5)) * 0.4;
    float caus = smoothstep(0.25, 0.85, cn);
    float focus = smoothstep(0.05, 0.85, dot(q, -normalize(L.xy))) * smoothstep(1.0, 0.7, length(q));
    col += mix(u_bright, u_glint, 0.35) * caus * focus * (0.28 + 0.55 * u_energy + 0.4 * u_level);

    // Subsurface: light pooled along the lower inner edge.
    float sss = pow(1.0 - z, 1.4) * smoothstep(0.3, -0.9, q.y + q.x * 0.35);
    col += u_bright * sss * (0.4 + 0.35 * u_energy);

    // Glass: a coloured fresnel rim, a bright crescent on the lit side, a crisp specular.
    float fres = pow(1.0 - z, 3.0);
    col = mix(col, u_bright * 0.85, fres * 0.45);
    float lit = smoothstep(0.1, 0.95, dot(normalize(q + 1e-4), normalize(L.xy)));
    float crescent = pow(1.0 - z, 2.2) * lit * smoothstep(0.995, 0.93, length(q));
    col += u_glint * crescent * 0.55;
    vec3 H = normalize(vec3(-0.42, 0.52, 0.74));
    float window = smoothstep(0.955, 0.99, dot(n, H));
    col += u_glint * window * 0.12;
    float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 120.0);
    col += u_glint * spec * 1.2;
  }

  // Halo: soft falloff outside the rim, stronger while speaking.
  float outside = max(r - edge, 0.0);
  float haloA = u_halo * exp(-outside * 10.0) * smoothstep(0.32, 0.05, outside) * (1.0 - mask) * (0.5 - 0.2 * u_light);
  vec3 orb = linearToSrgb(col);
  vec3 haloC = linearToSrgb(u_bright);
  float a = mask + haloA;
  vec3 premul = orb * mask + haloC * haloA;
  premul += (ign(gl_FragCoord.xy) - 0.5) / 255.0 * a;
  fragColor = vec4(premul, a);
}
`;
