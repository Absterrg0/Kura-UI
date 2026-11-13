"use client";

import { springs } from "@kura-ui/react/utils";
import { MotionConfig, motion, type Variants } from "motion/react";
import type * as React from "react";

/**
 * The site's entrances, on motion/react. Only opacity and transform move (motion hands both to the
 * compositor), never filters, so an entrance stays smooth while the page is still hydrating.
 * Under reduced motion `MotionConfig reducedMotion="user"` drops the movement and keeps the fade.
 */

export function SiteMotion({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

const enter = { ...springs.gentle, visualDuration: 0.7 };

/** One item of a staggered group: rises 16px and fades in, on its parent's cue. */
export const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: enter },
};

export const group = (gap = 0.07, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

const tags = {
  div: motion.div,
  ul: motion.ul,
  li: motion.li,
  figure: motion.figure,
  section: motion.section,
} as const;

/**
 * A group whose `StaggerItem` children come in one after another: on load (`onLoad`), or the
 * first time the group scrolls into view.
 */
export function Stagger({
  as = "div",
  gap,
  delay,
  onLoad = false,
  className,
  children,
}: {
  as?: keyof typeof tags;
  gap?: number;
  delay?: number;
  onLoad?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const Tag = tags[as];
  return (
    <Tag
      className={className}
      variants={group(gap, delay)}
      initial="hidden"
      {...(onLoad
        ? { animate: "show" }
        : { whileInView: "show", viewport: { once: true, amount: 0.12 } })}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({
  as = "div",
  className,
  style,
  children,
}: {
  as?: keyof typeof tags;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const Tag = tags[as];
  return (
    <Tag variants={item} className={className} style={style}>
      {children}
    </Tag>
  );
}

/** One element fading up on load, after `delay` seconds. */
export function Rise({
  delay = 0,
  className,
  children,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...enter, delay }}
    >
      {children}
    </motion.div>
  );
}
