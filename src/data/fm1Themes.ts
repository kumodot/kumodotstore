// FM1_Kz ready themes (the strip at the top of the Kustomizer).
//
// A theme is just a name and an order code. To add one: design it in the Kustomizer, press Copy, then paste the
// code in the Store Studio, tab "FM1 Themes". The Studio writes this file. Ids are codenames, not public names.
export interface Fm1ThemeData { id: string; name: string; code: string }

export const FM1_THEMES: Fm1ThemeData[] = [
  { id: "classic-theme", name: "Classic", code: "FM1v2|F=LG,DG,-,DG,-,-|L=CSPUWH,CSMGWH,CSMGWH,CSMGWH|R=CSBLWH,CSGRWH,CSYEWH,CSRDWH|4P" },
  { id: "sloop-theme", name: "SHRUB", code: "FM1v2|F=DG,GR,DG,=,SH,-|L=GSGRBK,GLBKGR,GLBKGR,GLBKGR|R=GLGRBK,GLGRBK,GLGRBK,GLGRBK|FQ" },
  { id: "jiant-theme", name: "BAUD GIRL", code: "FM1v2|F=DG,PU,PU,DG,BG,PU|L=CSPURD,CSPUWH,CSPUWH,CSPUWH|R=CSPUBL,CSPUGR,CSPUYE,CSPUOR|KQ" },
];
