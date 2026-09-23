export interface PropertyMeta {
  id: string;
  slug: string;
  name: string;
  listing: string;
  city: string;
  cotas?: number;
  valorMercado?: number;
  valorFinanciado?: number;
  capexInicial?: number;
  active: boolean;
}

export const PROPERTIES: PropertyMeta[] = [
  {
    id: "copan",
    slug: "copan",
    name: "Edifício Copan",
    listing: "Vem pro Copan, vista e design",
    city: "São Paulo, SP",
    cotas: 4,
    active: true,
  },
  {
    id: "flatincrivel-320",
    slug: "flatincrivel-320",
    name: "Flat Incrível 320",
    listing: "Flat na Riviera com Piscina Climatizada",
    city: "Riviera de São Lourenço, Bertioga, SP",
    cotas: 2,
    valorMercado: 535000,
    valorFinanciado: 428000,
    capexInicial: 129900.73,
    active: true,
  },
  {
    id: "flatincrivel-229",
    slug: "flatincrivel-229",
    name: "Flat Incrível 229",
    listing: "Flat Incrível - Duplex 2 Quartos",
    city: "Riviera de São Lourenço, Bertioga, SP",
    cotas: 3,
    valorMercado: 900000,
    active: true,
  },
];
