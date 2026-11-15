// Run: node tools/fm1Code.check.ts   (Node 22+, no test framework)
import assert from "node:assert/strict";
import { encodeFm1, decodeFm1, isFm1Code, SLOTS, type Fm1Build, type Knob } from "../src/features/fm1/fm1Code.ts";

const k = (style: Knob["style"], height: Knob["height"], body: string, cap: string): Knob =>
  ({ style, height, body, cap });
const knobs = Object.fromEntries(SLOTS.map((s, i) =>
  [s, i % 2 ? k("groove", "long", "RD", "WH") : k("classic", "short", "BL", "BK")])) as Fm1Build["knobs"];

const full: Fm1Build = { mode: "case", body: "LG", accent: "RD", side: null, bezel: null, badge: null, logo: null, knobs };
const code = encodeFm1(full);
assert.match(code, /^FM1v2\|F=LG,RD,-,=,-,-\|L=.+\|R=.+\|[0-9A-Z]{2}$/);
assert.deepEqual(decodeFm1(code), full);
assert.equal(decodeFm1(encodeFm1({ ...full, bezel: "OR" })).bezel, "OR");
assert.equal(decodeFm1(encodeFm1({ ...full, side: "BK" })).side, "BK");
assert.match(encodeFm1({ ...full, side: "BK" }), /F=LG,RD,BK,=,-,-/);
assert.equal(decodeFm1(encodeFm1({ ...full, badge: "sloop" })).badge, "sloop");
assert.equal(decodeFm1(encodeFm1({ ...full, badge: "sloop", logo: "OR" })).logo, "OR");
assert.equal(decodeFm1(encodeFm1(full)).logo, null);
assert.match(encodeFm1({ ...full, badge: "jiant" }), /F=LG,RD,-,=,JI,-/);
assert.throws(() => decodeFm1(encodeFm1({ ...full, badge: "sloop" }).replace(",SL,-|", ",ZZ,-|")), /check failed|Unknown bezel badge/);
// an older 4 field F (no badge) still decodes as the basic bezel
const checksum = (str: string) => {
  let a = 0;
  for (let i = 0; i < str.length; i++) a = (a * 31 + str.charCodeAt(i)) % 1296;
  return a.toString(36).toUpperCase().padStart(2, "0");
};
const fiveField = encodeFm1(full);
const legacyBody = fiveField.slice(0, fiveField.lastIndexOf("|")).replace(",=,-,-|L=", ",=|L=");
assert.equal(decodeFm1(legacyBody + "|" + checksum(legacyBody)).badge, null);
console.log("fm1Code: all checks passed");
