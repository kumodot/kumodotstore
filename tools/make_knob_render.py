"""Converts the knob layer renders into the web files used by the Kustomizer (public/renders).

usage: python tools/make_knob_render.py <folder with the PNGs> [--size 512]

Files in the folder (all PNG, 1024 x 1024, transparent, same camera and framing, nothing moved between them):
  all_knobs_base.png            the faceplate with its hole, no knob. One file, used by every knob.
  cap_short.png, cap_long.png   the cap of the plain knobs, one per height (used by every style of that height)
  vol_cap.png                   the cap of the volume knob (or vol_cap_short.png / vol_cap_long.png if it differs per height)
  <style>_<height>_body.png     body of the 7 plain knobs of that set, e.g. groove_long_body.png
  <style>_<height>_inner.png    optional: the black core of that set, drawn under the body (seen through translucent colors)
  <style>_<height>_cap.png      only if that set needs its own cap picture (a taller body puts the cap higher), e.g. classic_long_cap.png
  vol_<style>_<height>_body.png body of the volume knob (the 8th, different one) of that set
Each layer's own alpha is its mask: nothing is guessed, moved or cropped, only scaled down.
Rebuilds manifest.json from what is in the folder, so removed files disappear too.
"""
import argparse, glob, json, os
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("folder"); ap.add_argument("--size", type=int, default=512)
a = ap.parse_args()
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "renders")


def save(src, name):
    im = Image.open(src).convert("RGBA")
    assert im.size[0] == im.size[1], f"{src} is not square"
    im.resize((a.size, a.size), Image.LANCZOS).save(os.path.join(out, name), quality=90, method=6)


P = lambda n: os.path.join(a.folder, n + ".png")
manifest = {"caps": {}, "knobs": {}}
if os.path.exists(P("all_knobs_base")):
    save(P("all_knobs_base"), "knob_base.webp")
    manifest["base"] = "knob_base.webp"
for cap in ("cap_short", "cap_long", "vol_cap", "vol_cap_short", "vol_cap_long"):
    if os.path.exists(P(cap)):
        save(P(cap), f"knob_{cap}.webp")
        manifest["caps"][cap.replace("vol_cap", "vol").replace("cap_", "")] = f"knob_{cap}.webp"   # short, long, vol, vol_short, vol_long
for b in sorted(glob.glob(os.path.join(a.folder, "*_body.png"))):
    key = os.path.basename(b)[: -len("_body.png")]
    save(b, f"knob_{key}_body.webp")
    manifest["knobs"][key] = {"body": f"knob_{key}_body.webp"}
    if os.path.exists(P(f"{key}_inner")):   # black core under the body
        save(P(f"{key}_inner"), f"knob_{key}_inner.webp")
        manifest["knobs"][key]["inner"] = f"knob_{key}_inner.webp"
    if os.path.exists(P(f"{key}_cap")):   # own cap picture for this set
        save(P(f"{key}_cap"), f"knob_{key}_cap.webp")
        manifest["knobs"][key]["cap"] = f"knob_{key}_cap.webp"

keep = {"knob_base.webp"} | set(manifest["caps"].values()) | {f for e in manifest["knobs"].values() for f in e.values()}
for f in glob.glob(os.path.join(out, "knob_*")):
    if os.path.basename(f) not in keep:
        os.remove(f)
json.dump(manifest, open(os.path.join(out, "manifest.json"), "w"), indent=2)
print("base:", "base" in manifest, "| caps:", list(manifest["caps"]), "| bodies:", list(manifest["knobs"]))
