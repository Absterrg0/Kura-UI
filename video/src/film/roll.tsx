import { MONO } from "./palette";

/**
 * An odometer: each digit is a strip of 0–9 seen through a window; the ones roll continuously and
 * the tens turn only while the ones go from 9 to 0. Tabular Geist Mono, like the library's numbers.
 */
export function Roll({
  value,
  x,
  y,
  size,
  digits = 2,
  suffix = "",
  fill = "var(--kura-fg)",
  anchor = "start",
}: {
  value: number;
  x: number;
  y: number;
  size: number;
  digits?: number;
  suffix?: string;
  fill?: string;
  anchor?: "start" | "end";
}) {
  const adv = size * 0.6;
  const line = size * 1.0;
  const total = digits * adv + suffix.length * adv;
  const x0 = anchor === "end" ? x - total : x;
  const cols = [];
  for (let p = digits - 1; p >= 0; p--) {
    const unit = 10 ** p;
    const whole = Math.floor(value / unit);
    const frac = (value % unit) / unit;
    // Lower digits carry: this digit moves only during the last tenth of the one below.
    const carry = p === 0 ? frac : Math.max(0, (frac - 0.9) / 0.1);
    const pos = (whole % 10) + carry;
    const leading = p > 0 && value < unit && pos < 1;
    cols.push({ p, pos, leading });
  }
  const id = `roll-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g
      style={{
        fontFamily: MONO,
        fontWeight: 500,
        fontSize: size,
        fill,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <defs>
        <clipPath id={id}>
          <rect x={x0 - 4} y={y - size * 0.86} width={digits * adv + 8} height={line} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {cols.map((c, i) =>
          c.leading ? null : (
            <g key={c.p} transform={`translate(${x0 + i * adv} ${-c.pos * line})`}>
              {Array.from({ length: 11 }, (_, d) => (
                <text key={d} x={0} y={y + d * line}>
                  {d % 10}
                </text>
              ))}
            </g>
          ),
        )}
      </g>
      {suffix && (
        <text x={x0 + digits * adv} y={y}>
          {suffix}
        </text>
      )}
    </g>
  );
}
