// FM1_Kz ready themes (the strip at the top of the Kustomizer).
//
// A theme is just a name and an order code. To add one: design it in the Kustomizer, press Copy, then paste the
// code in the Store Studio, tab "FM1 Themes". The Studio writes this file. Ids are codenames, not public names.
export interface Fm1ThemeData { id: string; name: string; code: string }

export const FM1_THEMES: Fm1ThemeData[] = [
  { id: "classic-theme", name: "Classic", code: "FM1v2|F=LG,BK,-,=,-,-|L=CSORWH,CSMGWH,CSMGWH,CSMGWH|R=CSBLWH,CSGRWH,CSYEWH,CSRDWH|AB" },
  { id: "sloop-theme", name: "Theme 2", code: "FM1v2|F=DG,GR,-,=,-,-|L=GLGRBK,GLBKGR,GLBKGR,GLBKGR|R=GLGRBK,GLGRBK,GLGRBK,GLGRBK|OV" },
  { id: "jiant-theme", name: "Theme 3", code: "FM1v2|F=BK,YE,-,=,-,-|L=GSYEBK,GSWHBK,GSWHBK,GSWHBK|R=GSYEBK,GSYEBK,GSYEBK,GSYEBK|MN" },
];
