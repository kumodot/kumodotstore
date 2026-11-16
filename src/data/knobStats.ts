// Mini stats shown under the knob shape buttons (0 to 5 blocks, orange when filled).
// Order of each list: GRIP, PRECISION, BIG HANDS, 1-FINGER TWEAK, HOVER TWEAK, COMPACT.
// Keys are "<style>_<height>"; classic_long is the Chalice.
export const KNOB_STAT_LABELS = ["Grip", "Precision", "Big hands", "1-finger tweak", "Hover tweak", "Compact"] as const;

export const KNOB_STATS: Record<string, number[]> = {
  classic_short: [4, 5, 3, 2, 0, 5],
  classic_long: [4, 5, 5, 3, 2, 1],
  groove_short: [5, 3, 4, 5, 5, 4],
  groove_long: [5, 3, 5, 5, 5, 3],
};
