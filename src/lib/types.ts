export interface ColumnDef {
  key: string;
  year: number;
  month: string;
  label: string;
  col: number;
  isTotal: boolean;
}

export interface RowDef {
  id: string;
  label: string;
  type: "int" | "percent" | "currency";
  isHighlight?: boolean;
  values: Record<string, number | string | null>;
}

export interface OffsiteRecord {
  checkin: string | null;
  checkout: string | null;
  receita_bruta: number;
  lavanderia: number;
}

export interface CopanData {
  property: {
    name: string;
    listing: string;
    city: string;
    cotas: number;
  };
  columns: ColumnDef[];
  rows: RowDef[];
  offsite: OffsiteRecord[];
}
