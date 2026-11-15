# Knob preview renders

The Kustomizer shows a high quality knob picture when a buyer picks or recolors a knob.
Only images live here, never a 3D model: anything that reaches the browser can be copied, and a
picture cannot be printed. Keep it that way.

## Files, per variant

Variants are `<style>_<height>`: `classic_short`, `groove_short`, `groove_long`.

| File | What it is |
|---|---|
| `knob_<variant>.webp` | Neutral clay render of the whole knob, light gray material, soft studio light. Background removed (transparent). This carries all the shading. |
| `knob_<variant>_body.webp` | Mask of the **body**: any color, only the alpha matters (opaque where the body is). |
| `knob_<variant>_cap.webp` | Mask of the **cap**: same idea. |

All three share the same canvas: square, 1024 x 1024 (or 512), same framing, same camera.
Render the neutral pass with a mid-light gray (about #d9d9d9) so a white filament does not
look dull after the multiply. Slight 3/4 view from above works best.

## manifest.json

```json
{
  "knobs": {
    "groove_short": {
      "render": "knob_groove_short.webp",
      "body": "knob_groove_short_body.webp",
      "cap": "knob_groove_short_cap.webp"
    }
  }
}
```

A variant with no entry simply shows no preview. Add entries as the renders arrive.

## How it is composed (in the browser, nothing is uploaded)

body mask tinted with the body color + cap mask tinted with the cap color, then the neutral render
multiplied on top, then cut to the knob shape. The color you pick is the swatch color; the render
only adds light and shadow ("tint preview").

## Later

The same idea works for a short turntable video per variant (see TURNTABLE_PLAN_v0.1.md): the
neutral video plus the two masks as images.
