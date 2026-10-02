import { ExpenseExtractedItem } from "./types";

const CATEGORY_MAP: Record<string, { id: string; label: string }> = {
  condominio: { id: "condominio", label: "Condomínio" },
  energia_eletrica: { id: "energia_eletrica", label: "Energia Elétrica" },
  iptu: { id: "iptu", label: "IPTU" },
  financiamento: { id: "financiamento", label: "Financiamento Imobiliário" },
  manutencao: { id: "manutencao", label: "Manutenção / Reposição" },
  capex: { id: "capex", label: "CAPEX / Investimentos" },
  lavanderia_diarista: { id: "lavanderia_diarista", label: "Lavanderia / Diarista" },
  receita_offsite: { id: "receita_offsite", label: "Receita Offsite (Direta)" },
  outros: { id: "outros", label: "Outras Despesas" },
};

function parseBrDate(dateStr: string): { iso: string; monthKey: string } | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const [y, m, d] = clean.split("-");
    return { iso: `${y}-${m}-${d}`, monthKey: `${y}-${m}` };
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const parts = clean.split(/[\/\-\.]/);
  if (parts.length === 3) {
    let [d, m, y] = parts.map((p) => p.trim());
    if (y.length === 2) y = `20${y}`;
    if (d.length === 1) d = `0${d}`;
    if (m.length === 1) m = `0${m}`;

    // If month > 12, swap
    if (parseInt(m, 10) > 12 && parseInt(d, 10) <= 12) {
      const temp = d;
      d = m;
      m = temp;
    }

    return { iso: `${y}-${m}-${d}`, monthKey: `${y}-${m}` };
  }

  return null;
}

function parseBrMoney(moneyStr: string): number {
  if (!moneyStr) return 0;
  const clean = moneyStr
    .replace(/[R$\s]/gi, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : Math.abs(val);
}

/**
 * 1. Analyzes PDF text (Boletos, Contas de consumo, etc.)
 */
export async function analyzePdfDocument(
  pdfBuffer: Buffer,
  filename: string
): Promise<ExpenseExtractedItem> {
  // Use dynamic import for pdf-parse to support Next.js serverless bundling
  let text = "";
  try {
    const pdfParseModule = (await import("pdf-parse")) as any;
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const data = await pdfParse(pdfBuffer);
    text = data.text || "";
  } catch (err) {
    console.warn("pdf-parse fallback error:", err);
  }

  const upperText = text.toUpperCase();
  const upperName = filename.toUpperCase();

  // --- Identify Due Date (Vencimento) ---
  let dueDateIso = new Date().toISOString().slice(0, 10);
  let monthKey = dueDateIso.slice(0, 7);

  const vencMatch = text.match(
    /(?:vencimento|venc\.?|data\s*de\s*vencimento|pagar\s*at[ée])[:\s]*([0-3]?\d[\/\-\.][0-1]?\d[\/\-\.]\d{2,4})/i
  );
  if (vencMatch && vencMatch[1]) {
    const parsed = parseBrDate(vencMatch[1]);
    if (parsed) {
      dueDateIso = parsed.iso;
      monthKey = parsed.monthKey;
    }
  }

  // --- Identify Value ---
  let valor = 0;
  const valMatch = text.match(
    /(?:valor\s*(?:do\s*documento|cobrado|total|a\s*pagar)?|total\s*a\s*pagar|valor\s*líquido)[:\s]*(?:R\$)?\s*([\d\.]*,\d{2})/i
  );
  if (valMatch && valMatch[1]) {
    valor = parseBrMoney(valMatch[1]);
  } else {
    // Fallback: search for largest R$ value
    const allPrices = Array.from(text.matchAll(/(?:R\$|\$)\s*([\d\.]*,\d{2})/gi));
    if (allPrices.length > 0) {
      const parsedNums = allPrices.map((m) => parseBrMoney(m[1]));
      valor = Math.max(...parsedNums);
    }
  }

  // --- Identify Linha Digitável / Código de Barras ---
  let codigoBarras: string | undefined;
  const barcodeMatch = text.match(/\b\d{5}[.\s]?\d{5}\s\d{5}[.\s]?\d{6}\s\d{5}[.\s]?\d{6}\s\d\s\d{10,14}\b/);
  if (barcodeMatch) {
    codigoBarras = barcodeMatch[0].trim();
  }

  // --- Identify Vendor / Emissor ---
  let fornecedor = "Despesa Identificada";
  if (upperText.includes("NEOENERGIA") || upperName.includes("NEOENERGIA") || upperText.includes("ELEKTRO")) {
    fornecedor = "Neoenergia Elektro";
  } else if (upperText.includes("ENEL") || upperName.includes("ENEL")) {
    fornecedor = "Enel Distribuição";
  } else if (upperText.includes("CONDOMINIO") || upperName.includes("CONDOMINIO") || upperText.includes("EDIFICIO")) {
    fornecedor = "Condomínio Edifício";
  } else if (upperText.includes("PREFEITURA") || upperText.includes("IPTU") || upperName.includes("IPTU")) {
    fornecedor = "Prefeitura Municipal (IPTU)";
  } else if (upperText.includes("BRADESCO") || upperText.includes("ITAU") || upperText.includes("FINANCIAMENTO")) {
    fornecedor = "Financiamento Bancário";
  } else if (upperText.includes("SABESP")) {
    fornecedor = "Sabesp";
  }

  // --- Categorize ---
  let categoria = "outros";
  let confianca = 0.75;

  if (fornecedor.includes("Neoenergia") || fornecedor.includes("Enel") || upperText.includes("ENERGIA ELETRICA") || upperText.includes("KWH")) {
    categoria = "energia_eletrica";
    confianca = 0.95;
  } else if (fornecedor.includes("Condomínio") || upperText.includes("TAXA CONDOMINIAL") || upperText.includes("QUOTA CONDOMINIAL")) {
    categoria = "condominio";
    confianca = 0.95;
  } else if (fornecedor.includes("IPTU") || upperText.includes("IMPOSTO PREDIAL")) {
    categoria = "iptu";
    confianca = 0.95;
  } else if (fornecedor.includes("Financiamento") || upperText.includes("PARCELA FINANCIAMENTO")) {
    categoria = "financiamento";
    confianca = 0.9;
  } else if (upperText.includes("MATERIAL") || upperText.includes("CHUVEIRO") || upperText.includes("REPARO")) {
    categoria = "manutencao";
    confianca = 0.85;
  } else if (upperText.includes("REFORMA") || upperText.includes("AR CONDICIONADO") || upperText.includes("TV")) {
    categoria = "capex";
    confianca = 0.85;
  }

  // --- Identify Property ---
  let imovelSugerido = "copan";
  if (upperText.includes("320") || upperName.includes("320") || upperText.includes("APTO 320") || upperText.includes("FLAT 320")) {
    imovelSugerido = "flatincrivel-320";
  } else if (upperText.includes("229") || upperName.includes("229") || upperText.includes("APTO 229") || upperText.includes("FLAT 229")) {
    imovelSugerido = "flatincrivel-229";
  } else if (upperText.includes("COPAN") || upperName.includes("COPAN") || upperText.includes("IPIRANGA")) {
    imovelSugerido = "copan";
  }

  return {
    fornecedor,
    valor: Math.round(valor * 100) / 100,
    data: dueDateIso,
    mesCompetencia: monthKey,
    categoria,
    categoriaLabel: CATEGORY_MAP[categoria]?.label || "Outros",
    imovelSugerido,
    descricao: `${fornecedor} - Competência ${monthKey}`,
    confianca,
    codigoBarras,
  };
}

/**
 * 2. Analyzes Bank Statement (Extrato CSV/OFX)
 */
export function analyzeBankStatementText(csvText: string, defaultPropertyId: string = "copan"): ExpenseExtractedItem[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const items: ExpenseExtractedItem[] = [];

  // Auto-detect property from bank account/agency or header
  let detectedDefaultProperty = defaultPropertyId;
  const upperFullText = csvText.toUpperCase();
  if (upperFullText.includes("2050-8") || upperFullText.includes("3931") || upperFullText.includes("AMARILIS") || upperFullText.includes("FLAT 320")) {
    detectedDefaultProperty = "flatincrivel-320";
  } else if (upperFullText.includes("COPAN")) {
    detectedDefaultProperty = "copan";
  } else if (upperFullText.includes("229") || upperFullText.includes("DUPLEX")) {
    detectedDefaultProperty = "flatincrivel-229";
  }

  for (const line of lines) {
    // Ignore header/footer lines and empty separators
    if (
      line.includes("Filtro de resultados") ||
      line.includes("Últimos Lancamentos") ||
      line.includes("Data;Histórico") ||
      line.includes("Data,Histórico") ||
      line.includes("Extrato de:") ||
      line.includes("Os dados acima") ||
      line.includes("Não há lançamentos")
    ) {
      continue;
    }

    const parts = line.split(/[;,]/).map((p) => p.replace(/"/g, "").trim());
    if (parts.length < 3) continue;

    const dateStr = parts[0];
    const desc = parts[1] || "";
    const docto = parts.length >= 4 ? parts[2] : "";

    const parsedDate = parseBrDate(dateStr);
    if (!parsedDate) continue;

    const descUpper = desc.toUpperCase();

    // REGRA 1: Desconsiderar tudo que vier dos sócios Paulo Henrique e Rafael Fernandes (transferências entre contas)
    if (
      descUpper.includes("PAULO HENRIQUE") ||
      descUpper.includes("PAULO H") ||
      descUpper.includes("RAFAEL FERNANDES") ||
      descUpper.includes("RAFAEL F") ||
      descUpper.includes("RAFAEL")
    ) {
      continue;
    }

    // REGRA 2: Desconsiderar rentabilidade de caixa / aplicação automática
    if (
      descUpper.includes("RENTAB") ||
      descUpper.includes("FACILCRED") ||
      descUpper.includes("INVEST") ||
      descUpper.includes("RENDIMENTO") ||
      descUpper.includes("APLICACAO") ||
      descUpper.includes("SALDO")
    ) {
      continue;
    }

    // Identificar se é Débito ou Crédito e extrair valor
    let isDebito = false;
    let isCredito = false;
    let val = 0;

    // Formato Bradesco com 5 ou mais colunas: [Data, Histórico, Docto, Crédito, Débito, Saldo]
    if (parts.length >= 5) {
      const credVal = parseBrMoney(parts[3]);
      const debVal = parseBrMoney(parts[4]);

      if (debVal > 0) {
        isDebito = true;
        val = debVal;
      } else if (credVal > 0) {
        isCredito = true;
        val = credVal;
      }
    } else {
      // Formato padrão 3 colunas: [Data, Descrição, Valor]
      const rawValStr = parts[2];
      val = parseBrMoney(rawValStr);
      if (rawValStr.includes("-")) {
        isDebito = true;
      } else {
        isCredito = true;
      }
    }

    if (val <= 0) continue;

    let categoria = "outros";
    let categoriaLabel = "Outras Despesas";
    let fornecedor = desc;
    let tipo: "despesa" | "receita" = isCredito ? "receita" : "despesa";
    let diarias = isCredito ? 1 : 0;
    let confianca = 0.85;

    if (isDebito) {
      // REGRA 3: Pagamento para condomínio Amarílis / cobrança
      // Abaixo de R$ 1.300,00 é referente a Lavanderia / Diarista. Acima disso é Condomínio.
      if (
        descUpper.includes("AMARILIS") ||
        descUpper.includes("AMARILLIS") ||
        descUpper.includes("CONDOMINIO") ||
        descUpper.includes("COBRANCA") ||
        descUpper.includes("PAGTO ELETRON  COBRANCA") ||
        descUpper.includes("PAGTO ELETRON COBRANCA")
      ) {
        if (val < 1300) {
          categoria = "lavanderia_diarista";
          categoriaLabel = "Lavanderia / Diarista";
          fornecedor = "Condomínio Amarílis (Lavanderia)";
          confianca = 0.95;
        } else {
          categoria = "condominio";
          categoriaLabel = "Condomínio";
          fornecedor = "Condomínio Amarílis";
          confianca = 0.95;
        }
      } else if (
        descUpper.includes("PRESTACAO") ||
        descUpper.includes("CRED IMOB") ||
        descUpper.includes("FINANCIAMENTO")
      ) {
        categoria = "financiamento";
        categoriaLabel = "Financiamento Imobiliário";
        fornecedor = "Financiamento Bancário (Bradesco)";
        confianca = 0.95;
      } else if (
        descUpper.includes("LUZ") ||
        descUpper.includes("ELEKTRO") ||
        descUpper.includes("NEOENERGIA") ||
        descUpper.includes("ENEL") ||
        descUpper.includes("CONTA DE LUZ")
      ) {
        categoria = "energia_eletrica";
        categoriaLabel = "Energia Elétrica";
        fornecedor = "Energia Elétrica";
        confianca = 0.95;
      } else if (
        descUpper.includes("IPTU") ||
        descUpper.includes("TRIBUTO") ||
        descUpper.includes("PREFEITURA")
      ) {
        categoria = "iptu";
        categoriaLabel = "IPTU";
        fornecedor = "IPTU (Prefeitura)";
        confianca = 0.95;
      } else if (
        descUpper.includes("LEROY") ||
        descUpper.includes("MANUTENCAO") ||
        descUpper.includes("REPARO") ||
        descUpper.includes("CHILDFIX")
      ) {
        categoria = "manutencao";
        categoriaLabel = "Manutenção / Reposição";
        confianca = 0.85;
      } else if (
        descUpper.includes("CAPEX") ||
        descUpper.includes("REFORMA") ||
        descUpper.includes("MOVEIS")
      ) {
        categoria = "capex";
        categoriaLabel = "CAPEX / Investimentos";
        confianca = 0.85;
      }
    } else if (isCredito) {
      // REGRA 4: Outras entradas PIX considera receita offsite
      if (
        descUpper.includes("PIX") ||
        descUpper.includes("RECEBIDO") ||
        descUpper.includes("CRED") ||
        descUpper.includes("TRANSFERENCIA")
      ) {
        categoria = "receita_offsite";
        categoriaLabel = "Receita Offsite (Direta)";
        fornecedor = `${desc}${docto ? ` (Doc ${docto})` : ""}`;
        tipo = "receita";
        diarias = 1; // Padrão 1 diária, editável pelo usuário
        confianca = 0.95;
      }
    }

    let imovelSugerido = detectedDefaultProperty;
    if (descUpper.includes("320")) imovelSugerido = "flatincrivel-320";
    if (descUpper.includes("229")) imovelSugerido = "flatincrivel-229";
    if (descUpper.includes("COPAN")) imovelSugerido = "copan";

    items.push({
      fornecedor,
      valor: Math.round(val * 100) / 100,
      data: parsedDate.iso,
      mesCompetencia: parsedDate.monthKey,
      categoria,
      categoriaLabel: CATEGORY_MAP[categoria]?.label || categoriaLabel,
      imovelSugerido,
      descricao: docto ? `${desc} - Doc ${docto}` : desc,
      confianca,
      tipo,
      diarias,
    });
  }

  return items;
}

/**
 * 3. Analyzes Image using Gemini 1.5 Flash (Free Tier) if key exists, with local fallback
 */
export async function analyzeImageExpense(
  base64Image: string,
  mimeType: string,
  filename: string,
  defaultPropertyId: string = "copan"
): Promise<ExpenseExtractedItem> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const prompt = `Analise este comprovante/fatura/recibo brasileiro de aluguel por temporada e retorne APENAS um JSON válido no formato:
{
  "fornecedor": "Nome da empresa ou prestador",
  "valor": 123.45,
  "data": "YYYY-MM-DD",
  "mesCompetencia": "YYYY-MM",
  "categoria": "condominio|energia_eletrica|iptu|financiamento|manutencao|capex|lavanderia_diarista|outros",
  "categoriaLabel": "Rótulo legível",
  "imovelSugerido": "copan|flatincrivel-320|flatincrivel-229",
  "descricao": "Resumo do que foi pago",
  "codigoBarras": "linha digitável se houver"
}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType || "image/jpeg",
                    data: base64Image,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (res.ok) {
        const jsonRes = await res.json();
        const rawText = jsonRes.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleanJson = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanJson);

        return {
          fornecedor: parsed.fornecedor || "Comprovante Foto",
          valor: typeof parsed.valor === "number" ? Math.abs(parsed.valor) : 0,
          data: parsed.data || new Date().toISOString().slice(0, 10),
          mesCompetencia: parsed.mesCompetencia || new Date().toISOString().slice(0, 7),
          categoria: parsed.categoria || "manutencao",
          categoriaLabel: CATEGORY_MAP[parsed.categoria]?.label || parsed.categoriaLabel || "Manutenção",
          imovelSugerido: parsed.imovelSugerido || defaultPropertyId,
          descricao: parsed.descricao || "Despesa comprovada por imagem",
          confianca: 0.98,
          codigoBarras: parsed.codigoBarras,
        };
      }
    } catch (err) {
      console.warn("Gemini Vision API error, falling back to heuristic:", err);
    }
  }

  // Fallback if no API key or error
  const today = new Date().toISOString().slice(0, 10);
  const upperName = filename.toUpperCase();

  let cat = "manutencao";
  let forn = "Recibo / Fatura";
  if (upperName.includes("LUZ") || upperName.includes("NEOENERGIA") || upperName.includes("ENEL")) {
    cat = "energia_eletrica";
    forn = "Energia Elétrica";
  } else if (upperName.includes("CONDOMINIO")) {
    cat = "condominio";
    forn = "Condomínio";
  } else if (upperName.includes("IPTU")) {
    cat = "iptu";
    forn = "IPTU";
  } else if (upperName.includes("REFORMA") || upperName.includes("CAPEX")) {
    cat = "capex";
    forn = "CAPEX / Reforma";
  }

  let imovel = defaultPropertyId;
  if (upperName.includes("320")) imovel = "flatincrivel-320";
  if (upperName.includes("229")) imovel = "flatincrivel-229";
  if (upperName.includes("COPAN")) imovel = "copan";

  return {
    fornecedor: forn,
    valor: 0,
    data: today,
    mesCompetencia: today.slice(0, 7),
    categoria: cat,
    categoriaLabel: CATEGORY_MAP[cat]?.label || "Manutenção",
    imovelSugerido: imovel,
    descricao: `Imagem: ${filename}`,
    confianca: 0.7,
  };
}
