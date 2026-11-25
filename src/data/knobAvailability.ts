// FM1_Kz knob models: which are out of stock right now, and which take no cap.
//
// Written by the Store Studio (FM1 Themes tab, "Knob models"). Ids: classic_short, classic_long (Chalice),
// groove_short, groove_long.
// KNOBS_OFF: hidden from the model arrows on the public site; a theme or a pasted code that already uses it still
// loads, and the buyer sees a short out-of-stock note before ordering.
// KNOBS_NO_CAP: models that take no cap. The cap is hidden everywhere (3D, top view, picture, packing list); the
// order code keeps its cap color field, so switching the model back brings the cap back.
export const KNOBS_OFF: string[] = [];
export const KNOBS_NO_CAP: string[] = ["groove_short"];

export const knobOn = (style: string, height: string) => !KNOBS_OFF.includes(`${style}_${height}`);
export const hasCap = (style: string, height: string) => !KNOBS_NO_CAP.includes(`${style}_${height}`);
