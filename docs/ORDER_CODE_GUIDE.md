# FM1_Kz order codes: how to read them (and turn them into a packing list)

For whoever (person or agent) reads the **Personalization** box of an Etsy order for the FM1_Kz case or knobs.
The buyer builds the product in the Kustomizer (store.kumodot.art), presses **Finish**, and pastes the code in the
Etsy Personalization box. The code describes the whole customization. Nobody should read it by eye: use the
decoder below, or the **Order Decoder** tab of the Store Studio.

Reference implementations (they always give the same text):
- Python, no dependencies: `LOCAL_STORE_MANAGER/app/fm1_order.py` (`find_code()`, `parts_list()`).
- TypeScript, in the store: `src/features/fm1/fm1Parts.ts` (the Studio tab uses it).

## 1. Find the code in the text

The Etsy text can have anything around the code (a greeting, line breaks inside the code, spaces). Remove **all**
whitespace, then take the text from `FM1v2|` or `FM1k1|` up to the last `|` followed by exactly two characters
`0-9A-Z` (the check). `find_code()` does this. A buyer might also send the code in an Etsy message instead of the
Personalization box: same rule.

## 2. Format

```
Case + knobs:  FM1v2|F=<body>,<accent>,<side>,<bezel>,<badge>,<logo>|L=<k>,<k>,<k>,<k>|R=<k>,<k>,<k>,<k>|<check>
Knobs only:    FM1k1|L=<k>,<k>,<k>,<k>|R=<k>,<k>,<k>,<k>|<check>
```

Every color is a **2-letter id** (table in section 4). `|` separates blocks, `,` separates fields.

### F block (case only; 4, 5 or 6 fields)

| Field | Meaning |
|---|---|
| `body` | Faceplate color. The faceplate wraps the sides too. |
| `accent` | Accent color: the labels printed on the faceplate **and the bezel** (when the bezel field is `=`). |
| `side` | `-` = the sides follow the faceplate color. A color id = the sides are that color. |
| `bezel` | `=` = the bezel follows the accent color. `-` = **no bezel** (the buyer deleted it). A color id = that bezel color. |
| `badge` | `-` = simple bezel (a ring around the screen). A firmware code (table in section 5) = bezel with that firmware badge. A 4-field F has no badge. |
| `logo` | Color of the firmware logo. `-` = automatic (see section 6). Ignored when there is no badge. A 5-field F has no logo field (= automatic). |

### L and R blocks (knobs)

`L` = the 4 knobs on the left: **VOL, SEL., PRESET, ALG.** (in this order). `R` = the 4 knobs on the right: **K1, K2, K3, K4**.

Each knob is **6 characters**: `<style><height><body color><cap color>`

| Characters | Meaning |
|---|---|
| 1st: `C` or `G` | `C` = Classic style, `G` = Groove style |
| 2nd: `S` or `L` | `S` = short, `L` = long |
| 3rd and 4th | body color id |
| 5th and 6th | cap color id |

Knob models by the first two letters:

| Letters | Model |
|---|---|
| `CS` | Classic Short |
| `CL` | **Chalice** (the tall flared knob) |
| `GS` | Groove Short |
| `GL` | Groove Long |

The first knob (VOL) is the **volume knob**: it has its own shape and its own cap (the cap with the level mark),
so it is listed apart from the others. All other knobs of the same model share one body and one cap.

### The check (last field)

Two characters, base 36, uppercase. Algorithm, over the text **before** the last `|` (everything from `FM1...` to
the end of the R block, with the `|` separators):

```python
a = 0
for ch in text:
    a = (a * 31 + ord(ch)) % 1296
check = to_base36_uppercase(a).rjust(2, "0")
```

If the check does not match, a character was changed while copying: **ask the buyer for the code again**
(a wrong color in a printed knob is expensive).

## 3. What the list must contain

Every item is a bullet (`- `), so the list prints cleanly as a checklist.

For a case order (`FM1v2`):

```
FM1_Kz CASE + KNOBS
- FACEPLATE: <color>
- SIDES: <color> | same as the faceplate
- ACCENT (labels): <color>
- BEZEL: NONE (no bezel) | simple ring, <color> | extended bezel, <color> | JIANT bezel (its own shape), <color>
- FIRMWARE LOGO: <firmware>, <color> [(automatic)]       <- only when there is a badge
KNOB BODIES:
- <n>x [VOL ]<model>, <color> (<positions>)
KNOB CAPS:
- <n>x [VOL cap | cap], <color> (<positions>)
```

For knobs only (`FM1k1`): the first line is `FM1_Kz KNOBS ONLY (set of 8)` and there are no faceplate, sides, accent
or bezel lines. Knobs of the same model and color are grouped, with their positions. Colors marked **translucent**
are a different filament: the list shows "(TRANSLUCENT)" unless the name already says it.

## 4. Colors

| id | Name | Hex | Translucent |
|---|---|---|---|
| `RD` | Red | `#ff0000` |  |
| `OR` | Orange | `#ff9966` |  |
| `YE` | Yellow | `#f9e760` |  |
| `GR` | Green | `#88c449` |  |
| `IB` | Ice Blue | `#b2f0e5` |  |
| `BL` | Blue | `#45ccf5` |  |
| `PU` | Purple | `#a291cd` |  |
| `LG` | Light Gray | `#e0e0e0` |  |
| `MG` | Medium Gray | `#a0a0a0` |  |
| `DG` | Dark Gray | `#606060` |  |
| `WH` | White | `#ffffff` |  |
| `BK` | Black | `#000000` |  |
| `GD` | GOLD | `#d2940f` |  |
| `TW` | Translucent White | `#dbdbdb` | yes |
| `TO` | Translucent Orange | `#ff9500` | yes |

Colors are added in the Store Studio. After adding one, run `KUMODOT_STORE/tools/export_order_tables.py`: it
rewrites `docs/order-tables.json` and `LOCAL_STORE_MANAGER/app/fm1_tables.json`, which is what the decoder reads.
**Never change an existing id**: old orders would decode wrong.

## 5. Firmware badges

| Code | Firmware | Bezel | Logo |
|---|---|---|---|
| `SL` | SLOOP | extended bezel | yes |
| `JI` | JIANT | its own bezel (JIANT shape) | yes |
| `SH` | SHRUB | extended bezel | yes |
| `BG` | BaudGirl | extended bezel | yes |
| `BL` | BLANK | extended bezel | no (plain strip) |

## 6. Automatic logo color

When the `logo` field is `-`, the logo is painted in the **accent color** if it contrasts enough with the bezel
color (WCAG contrast ratio of at least 2.2), otherwise **black** if the bezel is light (relative luminance above 0.4)
or **white** if it is dark. `fm1_order.py` applies the same rule and prints "(automatic)".

## 7. Examples

Code:
```
FM1v2|F=OR,PU,BL,PU,JI,RD|L=GLMGWH,GLDGWH,GLDGWH,GLDGWH|R=GLPUWH,GLRDWH,GLORWH,GLYEWH|QA
```
List:
```
FM1_Kz CASE + KNOBS
- FACEPLATE: Orange
- SIDES: Blue
- ACCENT (labels): Purple
- BEZEL: JIANT bezel (its own shape), Purple
- FIRMWARE LOGO: JIANT, Red
KNOB BODIES:
- 1x VOL Groove Long, Medium Gray (VOL)
- 3x Groove Long, Dark Gray (SEL., PRESET, ALG.)
- 1x Groove Long, Purple (K1)
- 1x Groove Long, Red (K2)
- 1x Groove Long, Orange (K3)
- 1x Groove Long, Yellow (K4)
KNOB CAPS:
- 1x VOL cap, White (VOL)
- 7x cap, White (SEL., PRESET, ALG., K1, K2, K3, K4)
```

Code:
```
FM1v2|F=DG,GR,DG,=,SH,-|L=GSGRBK,GLBKGR,GLBKGR,GLBKGR|R=GLGRBK,GLGRBK,GLGRBK,GLGRBK|FQ
```
List:
```
FM1_Kz CASE + KNOBS
- FACEPLATE: Dark Gray
- SIDES: Dark Gray
- ACCENT (labels): Green
- BEZEL: extended bezel, Green
- FIRMWARE LOGO: SHRUB, Black (automatic)
KNOB BODIES:
- 1x VOL Groove Short, Green (VOL)
- 3x Groove Long, Black (SEL., PRESET, ALG.)
- 4x Groove Long, Green (K1, K2, K3, K4)
KNOB CAPS:
- 1x VOL cap, Black (VOL)
- 3x cap, Green (SEL., PRESET, ALG.)
- 4x cap, Black (K1, K2, K3, K4)
```

## 8. Using it from Python (the order manager)

```python
from fm1_order import find_code, parts_list

code = find_code(item_personalization_text)      # None when the text has no FM1 code
if code:
    try:
        lines = parts_list(code)                  # list of text lines for the packing slip
    except ValueError as e:
        lines = [f"CODE PROBLEM: {e}", "Ask the buyer to send the code again."]
```

Command line: `python fm1_order.py "<text with the code>"` prints the list.

## 9. Things that can go wrong

- **The Etsy text cuts the code** (character limit of the box): the check fails or the code is "incomplete". Ask the buyer.
- **Letters that look alike:** the code uses only `0-9`, `A-Z`, `|`, `,`, `=`, `-`. `O` (letter) and `0` (zero) can be
  mixed up when typed by hand, so the check catches it.
- **An old POKZ grid code** (`XX_XX_XX_XX/...`) is another product and is read by the order manager's own parser.
- **A theme listing** (a ready-made theme sold as its own listing) may come without a code: the theme name is in the
  listing title.
