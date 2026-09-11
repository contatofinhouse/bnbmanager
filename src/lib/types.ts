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

export interface PropertyData {
  property: {
    id: string;
    slug?: string;
    name: string;
    listing: string;
    city: string;
    cotas?: number; // 0 ou indefinido = sem divisão de cotas; 3 = Flat 229 (dividido por 3)
    valorMercado?: number;
  };
  columns: ColumnDef[];
  rows: RowDef[];
  offsite?: OffsiteRecord[];
}

export type CopanData = PropertyData;

export interface ExpenseExtractedItem {
  fornecedor: string;
  valor: number;
  data: string; // YYYY-MM-DD
  mesCompetencia: string; // YYYY-MM
  categoria: string; // "condominio" | "energia_eletrica" | "iptu" | "manutencao" | "lavanderia_diarista" | "capex" | "outros"
  categoriaLabel: string;
  imovelSugerido: string; // "copan" | "flatincrivel-320" | "flatincrivel-229"
  descricao: string;
  confianca: number; // 0 a 1
  codigoBarras?: string;
}
