export interface PropertyMeta {
  id: string;
  slug: string;
  name: string;
  listing: string;
  city: string;
  cotas?: number;
  valorMercado?: number;
  active: boolean;
}

export const PROPERTIES: PropertyMeta[] = [
  {
    id: "copan",
    slug: "copan",
    name: "Edifício Copan",
    listing: "Vem pro Copan, vista e design",
    city: "São Paulo, SP",
    cotas: 0,
    active: true,
  },
  {
    id: "flatincrivel-320",
    slug: "flatincrivel-320",
    name: "Flat Incrível 320",
    listing: "Flat Incrível 320 - Riviera",
    city: "Riviera de São Lourenço, Bertioga, SP",
    cotas: 0,
    valorMercado: 535000,
    active: true,
  },
  {
    id: "flatincrivel-229",
    slug: "flatincrivel-229",
    name: "Flat Incrível 229",
    listing: "Flat Incrível 229 - Riviera",
    city: "Riviera de São Lourenço, Bertioga, SP",
    cotas: 3,
    valorMercado: 900000,
    active: true,
  },
];
