import { z } from "zod";

const kebab = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const prop = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  default: z.string().optional(),
  required: z.boolean().optional(),
  description: z.string().min(3),
});

export const componentMetaSchema = z
  .object({
    slug: z.string().regex(kebab, "slug must be kebab-case"),
    name: z.string().regex(/^[A-Z][A-Za-z0-9]*$/, "name must be PascalCase"),
    category: z.enum([
      "agent",
      "workspace",
      "conversation",
      "input",
      "voice",
      "feedback",
      "primitives",
    ]),
    status: z.enum(["experimental", "beta", "stable"]),
    description: z.string().min(20).max(180),
    whenToUse: z.array(z.string().min(5)).min(1),
    whenNotToUse: z.array(z.string().min(5)).min(1),
    props: z.array(prop),
    parts: z
      .array(
        z.object({
          name: z.string().min(1),
          description: z.string().min(3),
          dataSlot: z.string().optional(),
          props: z.array(prop).optional(),
        }),
      )
      .optional(),
    a11y: z.object({
      role: z.string().optional(),
      notes: z.array(z.string()).min(1),
      keyboard: z.array(z.object({ keys: z.string(), action: z.string() })).optional(),
      reducedMotion: z.string().min(3),
    }),
    dependencies: z.object({ npm: z.array(z.string()), kura: z.array(z.string().regex(kebab)) }),
    related: z.array(z.string().regex(kebab)).optional(),
    tags: z.array(z.string().min(2)).min(3),
    examples: z
      .array(
        z.object({
          name: z.string().regex(/^[A-Z][A-Za-z0-9]*$/),
          title: z.string().min(2),
          description: z.string().optional(),
          kind: z.enum(["minimal", "full", "composition", "variant", "state"]),
        }),
      )
      .min(2),
    agentNotes: z.array(z.string()).optional(),
  })
  .strict();

export const hookMetaSchema = z
  .object({
    name: z.string().regex(/^use[A-Z]/),
    file: z.string().regex(kebab),
    description: z.string().min(10),
    signature: z.string().min(5),
    returns: z.string().min(3),
    notes: z.array(z.string()).optional(),
    example: z.string().min(5),
    tags: z.array(z.string()).min(1),
  })
  .strict();
