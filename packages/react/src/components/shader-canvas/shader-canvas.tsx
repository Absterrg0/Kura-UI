"use client";

import * as React from "react";
import { useReducedMotion } from "../../hooks/use-reduced-motion";
import { cn } from "../../lib/cn";
import { mergeRefs } from "../../lib/merge-refs";

export type UniformValue =
  | number
  | readonly [number, number]
  | readonly [number, number, number]
  | readonly [number, number, number, number];

/** Static value, or a function evaluated every frame (read refs/analysers here, not React state). */
export type UniformInput = UniformValue | ((time: number) => UniformValue);

export interface ShaderCanvasProps
  extends Omit<React.ComponentProps<"div">, "children" | "onError"> {
  /**
   * GLSL ES 3.00 fragment shader. If it does not start with `#version`, this header is prepended:
   * `#version 300 es`, `precision highp float;`, `uniform float u_time; uniform vec2 u_resolution;
   * uniform vec2 u_pointer;`, `out vec4 fragColor;` — so you only write `void main() { … }`.
   */
  fragmentShader: string;
  /**
   * Custom uniforms by name. number → float, [x,y] → vec2, [x,y,z] → vec3, [x,y,z,w] → vec4.
   * Declare them in the shader yourself. Values are read every frame, so updating this object
   * does not recompile the program.
   */
  uniforms?: Record<string, UniformInput>;
  /** Freeze time (keeps the last frame). */
  paused?: boolean;
  /** Time multiplier. Default 1. */
  speed?: number;
  /** Cap device-pixel-ratio for performance. Default 2. */
  maxDpr?: number;
  /** Stop rendering while offscreen (IntersectionObserver). Default true. */
  pauseWhenOffscreen?: boolean;
  /** `u_time` (seconds) used for the single static frame under reduced motion. Default 1.5. */
  staticTime?: number;
  /** Honour prefers-reduced-motion by rendering one static frame. Default true. */
  respectReducedMotion?: boolean;
  /** Rendered instead of the canvas when WebGL2 is unavailable or the shader fails to compile. Default: a soft token gradient. */
  fallback?: React.ReactNode;
  /** Called with the compile/link error message. Without it, the error is logged to the console. */
  onError?: (message: string) => void;
}

const VERTEX = `#version 300 es
in vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;

const HEADER = `#version 300 es
precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
out vec4 fragColor;
`;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | string {
  const shader = gl.createShader(type);
  if (!shader) return "createShader failed";
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "unknown compile error";
    gl.deleteShader(shader);
    return log;
  }
  return shader;
}

function setUniform(gl: WebGL2RenderingContext, loc: WebGLUniformLocation, v: UniformValue) {
  if (typeof v === "number") gl.uniform1f(loc, v);
  else if (v.length === 2) gl.uniform2f(loc, v[0], v[1]);
  else if (v.length === 3) gl.uniform3f(loc, v[0], v[1], v[2]);
  else gl.uniform4f(loc, v[0], v[1], v[2], v[3]);
}

/** Default fallback: a quiet gradient built from Kura tokens. */
function DefaultFallback() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 bg-[radial-gradient(120%_80%_at_30%_20%,var(--kura-accent-subtle),transparent_60%),radial-gradient(100%_70%_at_80%_90%,var(--kura-gray-4),transparent_70%)]"
    />
  );
}

/**
 * Minimal WebGL2 fragment-shader runner — the base for every Kura shader effect (mesh gradients,
 * auroras, grain, orbs). Handles DPR, resize, pointer, offscreen pausing, reduced motion, context
 * loss and a CSS fallback. Decorative by default (`aria-hidden`).
 */
export function ShaderCanvas({
  fragmentShader,
  uniforms,
  paused = false,
  speed = 1,
  maxDpr = 2,
  pauseWhenOffscreen = true,
  staticTime = 1.5,
  respectReducedMotion = true,
  fallback,
  onError,
  className,
  style,
  ref,
  ...props
}: ShaderCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const kickRef = React.useRef<() => void>(() => {});
  const [failed, setFailed] = React.useState(false);
  const reducedMotion = useReducedMotion();
  const isStatic = respectReducedMotion && reducedMotion;

  // Latest values, read inside the render loop without restarting it.
  const live = React.useRef({ uniforms, paused, speed, isStatic, staticTime, onError });
  live.current = { uniforms, paused, speed, isStatic, staticTime, onError };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: true });
    if (!gl) {
      setFailed(true);
      return;
    }
    setFailed(false);

    const report = (msg: string) => {
      if (!live.current.onError) console.error(`[kura/shader-canvas] ${msg}`);
      live.current.onError?.(msg);
      setFailed(true);
    };

    const fragSrc = fragmentShader.trimStart().startsWith("#version")
      ? fragmentShader
      : HEADER + fragmentShader;
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
    if (typeof vs === "string" || typeof fs === "string") {
      report(typeof fs === "string" ? fs : (vs as string));
      return;
    }
    const program = gl.createProgram();
    if (!program) return report("createProgram failed");
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return report(gl.getProgramInfoLog(program) ?? "link failed");
    }
    // biome-ignore lint/correctness/useHookAtTopLevel: WebGL method, not a React hook
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uPointer = gl.getUniformLocation(program, "u_pointer");
    const customLocs = new Map<string, WebGLUniformLocation | null>();

    const pointer = { x: 0.5, y: 0.5 };
    let visible = true;
    let raf = 0;
    let last = performance.now();
    let time = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const { width, height } = container.getBoundingClientRect();
      const w = Math.max(1, Math.round(width * dpr));
      const h = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const draw = (t: number) => {
      resize();
      if (uTime) gl.uniform1f(uTime, t);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uPointer) gl.uniform2f(uPointer, pointer.x, pointer.y);
      const custom = live.current.uniforms;
      if (custom) {
        for (const name in custom) {
          if (!customLocs.has(name)) customLocs.set(name, gl.getUniformLocation(program, name));
          const l = customLocs.get(name);
          const input = custom[name];
          if (!l || input === undefined) continue;
          setUniform(gl, l, typeof input === "function" ? input(t) : input);
        }
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const { paused: p, speed: s, isStatic: st, staticTime: stT } = live.current;
      if (st) {
        draw(stT);
      } else {
        if (!p) time += dt * s;
        draw(time);
      }
      raf = visible && !st && !p ? requestAnimationFrame(frame) : 0;
    };

    const kick = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    kickRef.current = kick;
    kick();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => kick()) : null;
    ro?.observe(container);

    const io =
      pauseWhenOffscreen && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(([entry]) => {
            visible = entry?.isIntersecting ?? true;
            if (visible) kick();
          })
        : null;
    io?.observe(container);

    const onPointer = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / Math.max(1, r.width);
      pointer.y = 1 - (e.clientY - r.top) / Math.max(1, r.height);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      raf = 0;
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      io?.disconnect();
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [fragmentShader, maxDpr, pauseWhenOffscreen]);

  // Resume the loop when un-pausing or leaving reduced motion.
  React.useEffect(() => {
    if (!paused || isStatic) kickRef.current();
  }, [paused, isStatic]);

  return (
    <div
      ref={mergeRefs(containerRef, ref)}
      data-slot="shader-canvas"
      data-state={failed ? "fallback" : isStatic ? "static" : paused ? "paused" : "running"}
      aria-hidden
      className={cn("relative overflow-hidden", className)}
      style={style}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className={cn("absolute inset-0 block size-full", failed && "hidden")}
      />
      {failed && (fallback ?? <DefaultFallback />)}
    </div>
  );
}
