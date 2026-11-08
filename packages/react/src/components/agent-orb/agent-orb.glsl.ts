import { GLSL_COLOR } from "../../lib/shader-color";

/**
 * The agent orb: an analytic sphere (no geometry) holding slow, soft clouds of colour. Per pixel we
 *   1. find the (breathing, audio-swollen) silhouette and the sphere normal,
 *   2. sample two octaves of domain-warped 3D simplex noise *on the sphere surface*, turning
 *      slowly like a globe and twisting around the view axis while thinking — so the clouds wrap
 *      around the curvature instead of sliding across a disc,
 *   3. blend the palette in OKLab (pearl → mid → signal tone), no muddy midpoints,
 *   4. light it quietly: a little wrap diffuse, a pearly fresnel rim, one broad window sheen,
 *   5. outside the sphere: a soft contact shadow on light backgrounds, a faint halo on dark ones,
 *      written as premultiplied alpha so it sits on any surface.
 * One sRGB encode + IGN dither at the end.
 */
export const AGENT_ORB_FRAG = /* glsl */ `
uniform vec3 u_deep;    // OKLab: the signal tone (densest clouds)
uniform vec3 u_mid;     // OKLab: body
uniform vec3 u_bright;  // OKLab: the light between clouds
uniform vec3 u_glint;   // OKLab: rim and sheen
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

void main() {
  float s = min(u_resolution.x, u_resolution.y);
  float px = 2.0 / s;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution) * px;
  float t = u_phase;

  // Silhouette: a slow breath when idle, a gentle swell with the voice.
  float R = 0.84 * (1.0 + 0.012 * u_breath * sin(u_time * 1.3) + 0.04 * u_level);
  float r = length(p);
  vec2 dir = r > 0.0 ? p / r : vec2(0.0, 1.0);
  float edge = R * (1.0 + snoise(vec3(dir * 1.1, t * 0.6)) * 0.012 * u_level);
  float mask = smoothstep(edge + px, edge - px, r);

  vec3 lab = u_mid;
  if (mask > 0.0) {
    vec2 q = p / edge;
    float rq = min(length(q), 1.0);
    float z = sqrt(max(0.0, 1.0 - rq * rq));
    vec3 n = normalize(vec3(q, z));

    // Clouds live on the surface: turn the sphere slowly, twist it while thinking.
    vec3 P = n;
    P.xy = rot(u_spin + u_swirl * 1.8 * (1.0 - rq)) * P.xy;
    P.xz = rot(t * 0.16) * P.xz;
    vec3 w = P * 0.72;
    float n1 = snoise(w + vec3(0.0, t * 0.17, t * 0.1));
    float n2 = snoise(w * 1.45 + n1 * (0.45 + 0.6 * u_energy) + vec3(t * 0.12, 3.1, -t * 0.08));
    float clouds = smoothstep(-0.75, 0.85, n1 * 0.7 + n2 * 0.38);
    float gaps = smoothstep(0.05, 0.95, snoise(w * 0.8 - vec3(2.7, t * 0.15, 1.3) + n2 * 0.25));

    vec3 body = mix(u_bright, u_mid, clouds);
    body = mix(body, u_deep, smoothstep(0.5, 1.0, clouds) * (0.62 + 0.3 * u_energy));
    body = mix(body, u_bright, gaps * (0.22 + 0.3 * u_level));

    // Volume: soft wrap diffuse from the top left, slightly deeper toward the limb.
    vec3 L = normalize(vec3(-0.45, 0.6, 0.66));
    float diff = dot(n, L) * 0.5 + 0.5;
    body.x *= mix(0.86, 1.03, diff) * (1.0 - 0.08 * pow(1.0 - z, 1.5));
    // The voice lifts the core a touch.
    body.x += exp(-dot(q, q) * 2.4) * 0.05 * u_level;

    // Glass: a pearly fresnel rim, one broad window sheen, a small soft highlight.
    float fres = pow(1.0 - z, 3.0);
    body = mix(body, u_glint, fres * mix(0.35, 0.55, u_light));
    vec3 H = normalize(vec3(-0.5, 0.62, 0.6));
    float nh = max(dot(n, H), 0.0);
    body = mix(body, u_glint, smoothstep(0.84, 0.99, nh) * 0.2 + pow(nh, 80.0) * 0.3);

    // A hairline just inside the edge keeps a pale orb crisp on a pale page.
    body.x -= 0.045 * u_light * smoothstep(edge - px * 2.5, edge - px * 0.5, r);
    lab = body;
  }

  // Outside: contact shadow on light backgrounds, a faint halo on dark ones.
  float outside = max(r - edge, 0.0);
  float sd = max(length(p - vec2(0.0, -0.04)) - edge, 0.0);
  // Both fade to zero well inside the square box, so no edge ever shows.
  float room = 1.0 - edge;
  float shadowA = u_light * exp(-sd * 18.0) * 0.1 * smoothstep(room, room * 0.3, sd) * (1.0 - mask);
  float haloA = (1.0 - u_light) * u_halo * exp(-outside * 14.0) * 0.22
              * smoothstep(room, room * 0.2, outside) * (1.0 - mask);
  vec3 orb = linearToSrgb(oklabToLinear(lab));
  vec3 haloC = linearToSrgb(oklabToLinear(u_deep));
  float a = mask + haloA + shadowA;
  vec3 premul = orb * mask + haloC * haloA;
  premul += (ign(gl_FragCoord.xy) - 0.5) / 255.0 * a;
  fragColor = vec4(premul, a);
}
`;
