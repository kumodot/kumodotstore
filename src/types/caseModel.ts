export interface CaseModel {
  id: string;
  name: string;
  description: string;
  gridCols: number;
  gridRows: number;
  buttonCount: number;
  groupSize: number;
  defaultColorId: string;
  etsyUrl?: string;
}
