// FM1_Kz ready themes (the strip at the top of the Kustomizer).
//
// A theme is just a name and an order code. To add one: design it in the Kustomizer, press Copy, then paste the
// code in the Store Studio, tab "FM1 Themes". The Studio writes this file. Ids are codenames, not public names.
export interface Fm1ThemeData { id: string; name: string; code: string }

export const FM1_THEMES: Fm1ThemeData[] = [
  { id: "classic-theme", name: "Classic V1", code: "FM1v2|F=LG,DG,-,DG,-,-|L=CSPUWH,CSMGWH,CSMGWH,CSMGWH|R=CSBLWH,CSGRWH,CSYEWH,CSRDWH|4P" },
  { id: "grooved-sloop-v1", name: "Grooved SLOOP V1", code: "FM1v2|F=DG,DG,-,DG,SL,-|L=GLMGRD,GLDGWH,GLDGWH,GLDGWH|R=GLDGBL,GLDGGR,GLDGYE,GLDGOR|I3" },
  { id: "grooved-sloop-v2", name: "Grooved SLOOP V2", code: "FM1v2|F=DG,DG,-,LG,SL,-|L=CLMGRD,CLDGWH,CLDGWH,CLDGWH|R=CLDGBL,CLDGGR,CLDGYE,CLDGOR|O3" },
  { id: "jiant-theme", name: "BAUD GIRL V1", code: "FM1v2|F=DG,PU,PU,BK,BG,PU|L=CSPURD,CSPUWH,CSPUWH,CSPUWH|R=CSPUBL,CSPUGR,CSPUYE,CSPUOR|R4" },
  { id: "jiant-v1", name: "JIANT V1", code: "FM1v2|F=OR,PU,BL,PU,JI,RD|L=GLMGWH,GLDGWH,GLDGWH,GLDGWH|R=GLPUWH,GLRDWH,GLORWH,GLYEWH|QA" },
  { id: "sloop-theme", name: "SHRUB V1", code: "FM1v2|F=DG,GR,DG,=,SH,-|L=GSGRBK,GLBKGR,GLBKGR,GLBKGR|R=GLGRBK,GLGRBK,GLGRBK,GLGRBK|FQ" },
  { id: "shrub-v1-reverse", name: "SHRUB V1 Reverse", code: "FM1v2|F=BK,GR,BK,BK,SH,-|L=GLBKRD,GLBKGR,GLBKGR,GLBKGR|R=GLBKGR,GLBKGR,GLBKGR,GLBKGR|5A" },
];
