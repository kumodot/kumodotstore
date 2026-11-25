// FM1_Kz ready themes (the strip at the top of the Kustomizer).
//
// A theme is a name and an order code. To add one: design it in the Kustomizer, press Copy, then paste the
// code in the Store Studio, tab "FM1 Themes". The Studio writes this file. Ids are codenames, not public names.
// enabled: false = hidden on the public site (ready but not released yet).
// lock: SHA-256 of a secret unlock code (see src/features/fm1/themeLock.ts); the theme only shows for buyers who
// typed that code in the Kustomizer. The code itself is never stored here.
export interface Fm1ThemeData { id: string; name: string; code: string; enabled?: boolean; lock?: string }

export const FM1_THEMES: Fm1ThemeData[] = [
  { id: "classic-theme", name: "Classic V1", code: "FM1v2|F=LG,DG,-,DG,-,-|L=CSPUWH,CSMGWH,CSMGWH,CSMGWH|R=CSBLWH,CSGRWH,CSYEWH,CSRDWH|4P" },
  { id: "grooved-sloop-v1", name: "Grooved SLOOP V1", code: "FM1v2|F=DG,DG,-,DG,SL,-|L=GLMGRD,GLDGWH,GLDGWH,GLDGWH|R=GLDGBL,GLDGGR,GLDGYE,GLDGOR|I3", lock: "c04d40ee2aa60c36dccb1763e0f56ad83df964d2d14a3621c37a397a41f151c1" },
  { id: "grooved-sloop-v2", name: "Grooved SLOOP V2", code: "FM1v2|F=DG,DG,-,LG,SL,-|L=CLMGRD,CLDGWH,CLDGWH,CLDGWH|R=CLDGBL,CLDGGR,CLDGYE,CLDGOR|O3" },
  { id: "jiant-theme", name: "BAUD GIRL V1", code: "FM1v2|F=DG,PU,PU,BK,BG,PU|L=CSPURD,CSPUWH,CSPUWH,CSPUWH|R=CSPUBL,CSPUGR,CSPUYE,CSPUOR|R4" },
  { id: "jiant-v1", name: "JIANT V1", code: "FM1v2|F=OR,PU,BL,PU,JI,RD|L=GLBLWH,GLBKWH,GLBKWH,GLBKWH|R=GLPUWH,GLRDWH,GLORWH,GLYEWH|X4", lock: "b4c6654d921bb06afe34d8161f49e33c34c7fc242342c23c10766374df9c2418" },
  { id: "jiant-v2", name: "JIANT V2", code: "FM1v2|F=BL,BK,-,YE,JI,RD|L=GLBLWH,GLBKWH,GLBKWH,GLBKWH|R=GLPUWH,GLRDWH,GLORWH,GLYEWH|D1", lock: "2c3a727edce07cd0092dfce3a009267519c52c2d3800d0c8384b11bdb081e7ee" },
  { id: "jiant-v3", name: "JIANT V3", code: "FM1v2|F=YE,DP,YE,DP,JI,YE|L=CSBLWH,GLBKWH,GLBKWH,GLBKWH|R=GLPUWH,GLRDWH,GLORWH,GLYEWH|VU", lock: "a06504ee5605e7246680741dd7fd75c6912d2f9ba8ccea2a9ff66af0f3c3152a" },
  { id: "sloop-theme", name: "SHRUB V1", code: "FM1v2|F=DG,GR,DG,=,SH,-|L=GSGRBK,GLBKGR,GLBKGR,GLBKGR|R=GLGRBK,GLGRBK,GLGRBK,GLGRBK|FQ", lock: "793d027ab8b1ece26a79729c71493283695f8244e98415d474cf57d52e51a150" },
  { id: "shrub-v1-reverse", name: "SHRUB V1 Reverse", code: "FM1v2|F=BK,GR,BK,BK,SH,-|L=GLBKRD,GLBKGR,GLBKGR,GLBKGR|R=GLBKGR,GLBKGR,GLBKGR,GLBKGR|5A", lock: "bfb1fd94bcbbead15f5402c14adca6751975238ec324af1918bc67d128eb6c44" },
];
