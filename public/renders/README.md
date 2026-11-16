# Knob preview renders

The Kustomizer shows a high quality knob picture when a buyer picks or recolors a knob.
Only images live here, never a 3D model: anything that reaches the browser can be copied, and a
picture cannot be printed. Keep it that way.

## What to render (PNG, 1024 x 1024, transparent background, same camera and framing, nothing moved between renders)

A set is `<style>_<height>`: `classic_short`, `groove_short`, `groove_long`, later `classic_long`. Every set has 7 identical
knobs and 1 different one, the volume knob.

| File | Used by |
|---|---|
| `all_knobs_base.png` | The faceplate with its hole, no knob. Every knob. |
| `cap_short.png`, `cap_long.png` | The cap of the plain knobs, one per height, shared by all styles. |
| `vol_cap.png` | The cap of the volume knob (`vol_cap_short.png` / `vol_cap_long.png` instead, if it differs per height). |
| `<set>_body.png`, e.g. `groove_long_body.png` | Body of the 7 plain knobs of that set. |
| `vol_<set>_body.png`, e.g. `vol_groove_long_body.png` | Body of the volume knob of that set. |

Each layer's own alpha is its mask. Nothing is guessed or moved, so the layers must already line up.

## Convert

```
python tools/make_knob_render.py <folder with the PNGs>
```

Writes the 512 px webp files here and rebuilds `manifest.json`. Keep the source PNGs outside `public/`.

## How it is composed (in the browser, nothing is uploaded)

base, then the body multiplied by the body color, then the cap multiplied by the cap color. Multiply keeps the
shading of the render; each picture's alpha cuts its own shape. A knob that lacks its body or cap render shows no picture.
