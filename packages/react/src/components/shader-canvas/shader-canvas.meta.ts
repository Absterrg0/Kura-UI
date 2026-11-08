import { defineComponent } from "../../lib/define-component";

export default defineComponent({
  slug: "shader-canvas",
  name: "ShaderCanvas",
  category: "effects",
  status: "beta",
  description:
    "Minimal WebGL2 fragment-shader runner with time/resolution/pointer uniforms, DPR capping, offscreen pausing, reduced-motion still frame and CSS fallback.",
  whenToUse: [
    "Building any GPU visual: mesh gradients, auroras, grain, glows, orbs, generative backgrounds.",
    "A custom decorative shader behind a hero, card or voice surface.",
  ],
  whenNotToUse: [
    "A ready-made effect exists — use mesh-gradient, agent-orb, grain or border-beam.",
    "Static gradients — plain CSS is cheaper.",
    "Anything that conveys information — it is aria-hidden and may fall back to a static gradient.",
  ],
  props: [
    {
      name: "fragmentShader",
      type: "string",
      required: true,
      description:
        "GLSL ES 3.00 source. Without a #version line, a header declaring u_time, u_resolution, u_pointer and `out vec4 fragColor` is prepended.",
    },
    {
      name: "uniforms",
      type: "Record<string, UniformInput>",
      description:
        "Custom uniforms: number→float, [x,y]→vec2, [x,y,z]→vec3, [x,y,z,w]→vec4, or a function of time evaluated every frame. Declare them in the shader.",
    },
    {
      name: "paused",
      type: "boolean",
      default: "false",
      description: "Freeze time on the current frame.",
    },
    { name: "speed", type: "number", default: "1", description: "Time multiplier." },
    { name: "maxDpr", type: "number", default: "2", description: "Device-pixel-ratio cap." },
    {
      name: "pauseWhenOffscreen",
      type: "boolean",
      default: "true",
      description: "Stop rendering when not visible.",
    },
    {
      name: "staticTime",
      type: "number",
      default: "1.5",
      description: "u_time used for the reduced-motion still frame.",
    },
    {
      name: "respectReducedMotion",
      type: "boolean",
      default: "true",
      description: "Render a single still frame when the user prefers reduced motion.",
    },
    {
      name: "fallback",
      type: "React.ReactNode",
      description:
        'Shown when WebGL2 is unavailable or the shader fails. Default: a sunken neutral surface with one soft accent-subtle wash (tokens, follows the theme; `data-slot="shader-canvas-fallback"`).',
    },
    {
      name: "onError",
      type: "(message: string) => void",
      description: "Compile/link error callback.",
    },
  ],
  parts: [
    {
      name: "ShaderCanvas",
      dataSlot: "shader-canvas",
      description:
        "Container div (size it with classes); `data-state` = running | paused | static | fallback.",
    },
    {
      name: "DefaultFallback",
      dataSlot: "shader-canvas-fallback",
      description:
        "Rendered only when WebGL2 fails and no `fallback` is passed: a neutral token gradient with a soft accent wash.",
    },
  ],
  a11y: {
    notes: [
      "Decorative: the container is aria-hidden. Never put meaning only in the shader.",
      "Respects prefers-reduced-motion with a single still frame.",
    ],
    reducedMotion: "Renders one frame at `staticTime` and stops the animation loop.",
  },
  dependencies: { npm: [], kura: [] },
  related: ["mesh-gradient", "agent-orb", "grain", "border-beam"],
  tags: ["webgl", "shader", "glsl", "gpu", "background", "gradient", "effect", "canvas"],
  examples: [
    { name: "ShaderCanvasMinimal", kind: "minimal", title: "Gradient in a few lines" },
    {
      name: "ShaderCanvasFull",
      kind: "full",
      title: "Silk with custom uniforms",
      description: "Custom color uniforms, speed control, pause and pointer response.",
    },
    {
      name: "ShaderCanvasFeatureCard",
      kind: "composition",
      title: "Feature card with a live band",
      description:
        "A ShaderCanvas header behind a glass chip, with copy, stats and Buttons on a token surface.",
    },
  ],
  agentNotes: [
    'Give the container an explicit size (e.g. `className="h-64 w-full rounded-kura-xl"`); the canvas fills it.',
    "Animate custom uniforms with function values `(t) => …` or by mutating an object you pass — not React state per frame.",
    "Colors in shaders cannot read CSS variables; pass them as vec3 uniforms (linear 0–1 RGB).",
  ],
});
