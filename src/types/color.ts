export interface FilamentColor {
  id: string;
  name: string;
  rgb: [number, number, number];
  hex: string;
  available: boolean;
  translucent?: boolean;   // translucent filament: drawn with diagonal stripes and see-through in the 3D view
  knobsOnly?: boolean;     // can only be picked for knobs (not for the faceplate, accent, sides or bezel)
}
