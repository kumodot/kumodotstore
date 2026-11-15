import { Fm1TopView } from "./Fm1TopView.tsx";
import type { Fm1Build } from "./fm1Code.ts";

/** Filmstrip thumbnail: the same top view as the big panel, without interaction. */
export function Fm1Thumb({ build, hex, factory }: {
  build: Fm1Build;
  hex: (id: string) => string;
  factory: { body: string; keys: string };
}) {
  return <Fm1TopView build={build} hex={hex} factory={factory} />;
}
