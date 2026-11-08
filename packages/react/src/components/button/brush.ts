/**
 * The brush swash behind `variant="brush"`: 28 bristles of one sumi stroke over a solid core, roughened by a
 * displacement filter, drawn into a 400×100 box that stretches to the button. It is used as a CSS
 * mask over a block of ink, so the colour stays a token and the label above it stays crisp text.
 */
const BRISTLES: ReadonlyArray<readonly [points: string, width: number]> = [
  ["27,25 71,9 114,9 159,11 203,10 247,8 291,8 335,14", 5.4],
  ["30,26 78,13 127,12 176,12 225,12 274,12 323,16 372,25", 5.8],
  ["18,38 65,15 113,14 162,16 210,16 258,15 306,15 354,22", 6.3],
  ["17,40 58,18 100,17 142,19 184,20 227,19 269,17 311,18", 5.9],
  ["19,40 71,23 124,21 177,20 230,20 282,22 335,26 387,35", 4.4],
  ["20,38 72,24 125,27 177,26 230,22 282,21 334,28 386,38", 5.3],
  ["25,38 71,27 117,27 164,28 210,28 257,26 303,27 350,32", 5.9],
  ["20,43 65,32 110,30 155,30 200,29 245,29 290,31 335,34", 6.3],
  ["20,45 70,34 120,32 170,32 221,34 271,34 321,35 371,39", 4.4],
  ["21,45 69,35 116,34 164,36 212,38 259,37 307,36 354,38", 6.6],
  ["16,48 68,37 120,39 172,42 225,41 277,37 329,38 381,45", 5.4],
  ["20,49 72,43 125,41 177,41 229,42 282,43 334,44 386,47", 6.2],
  ["17,51 69,44 121,43 174,45 226,47 278,46 330,45 383,48", 6.1],
  ["18,51 70,47 123,48 175,50 227,49 280,47 332,47 384,51", 6.2],
  ["20,52 71,51 121,53 171,52 221,50 272,49 322,51 372,54", 6.1],
  ["22,54 74,56 126,55 178,53 230,52 282,54 334,56 386,55", 4.8],
  ["27,57 76,60 124,57 173,55 222,55 270,58 319,60 368,58", 6.5],
  ["21,56 70,60 118,62 166,62 215,60 263,58 311,58 360,60", 4.5],
  ["19,58 70,64 122,62 173,62 224,63 275,65 326,63 377,60", 5.0],
  ["17,59 70,68 122,66 174,64 226,65 279,67 331,67 384,62", 4.8],
  ["22,62 71,71 120,69 169,67 217,68 266,70 314,70 363,66", 5.4],
  ["32,69 80,73 129,70 177,70 226,73 274,75 323,72 371,66", 6.5],
  ["21,65 72,79 122,76 173,72 223,72 274,76 324,77 375,70", 6.6],
  ["36,77 77,82 118,77 159,74 200,74 241,78 282,82 323,80", 5.3],
  ["17,65 56,84 94,81 132,79 170,78 208,80 246,83 283,84", 6.0],
  ["36,80 77,88 117,85 158,82 198,80 238,82 279,85 319,85", 4.7],
  ["18,68 68,90 118,87 168,84 217,85 267,89 316,88 367,79", 6.4],
  ["24,74 60,92 95,92 131,90 166,88 201,88 237,88 272,90", 4.3],
];

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100" preserveAspectRatio="none">' +
  '<filter id="r"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" result="n"/>' +
  '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>' +
  '<g filter="url(#r)" fill="none" stroke="black" stroke-linecap="round" stroke-linejoin="round">' +
  BRISTLES.map(([points, width]) => `<polyline points="${points}" stroke-width="${width}"/>`).join(
    "",
  ) +
  // A solid core under the label, so the dry-brush gaps only show at the edges and ends.
  '<path fill="black" stroke="none" d="M60 30C140 22 270 22 340 28L342 68C270 75 140 76 58 70Z"/>' +
  "</g></svg>";

/** `url("data:image/svg+xml,…")`, ready for `mask-image`. */
export const BRUSH_SWASH_MASK = `url("data:image/svg+xml,${encodeURIComponent(SVG)}")`;
