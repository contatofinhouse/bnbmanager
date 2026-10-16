const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT_DIR = path.resolve(__dirname);
const OUT_HTML = path.join(OUT_DIR, 'FINHOUSE_Resumo_Proprietarios.html');
const OUT_PDF = path.join(OUT_DIR, 'FINHOUSE_Resumo_Proprietarios.pdf');
const PUBLIC_DEST = 'C:/Users/rafae/Documents/FINHOUSE/SITES/finhouse_oficial/public/bnb/FINHOUSE_Resumo_Proprietarios.pdf';

function toBase64(filePath, mime) {
  if (!fs.existsSync(filePath)) return '';
  return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
}

const logoB64 = toBase64('C:/Users/rafae/Documents/FINHOUSE/SITES/finhouse_oficial/public/logo.png', 'image/png');
const copanB64 = toBase64('C:/Users/rafae/Documents/FINHOUSE/SITES/finhouse_oficial/public/bnb/copan.jpg', 'image/jpeg');
const rivieraB64 = toBase64('C:/Users/rafae/Documents/FINHOUSE/SITES/finhouse_oficial/public/bnb/riviera.jpg', 'image/jpeg');
const reportB64 = toBase64('C:/Users/rafae/Documents/FINHOUSE/SITES/finhouse_oficial/public/bnb/dashboard-report.png', 'image/png');

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Resumo para Proprietários · finHouse Short Stay</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 16mm 14mm 16mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1E293B;
      background: #FFFFFF;
      font-size: 9pt;
      line-height: 1.45;
      -webkit-font-smoothing: antialiased;
    }
    .page {
      width: 100%;
      height: 100%;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .page:last-child {
      page-break-after: avoid;
    }

    /* Cores Institucionais */
    :root {
      --navy: #0F3B78;
      --navy-dark: #0A2752;
      --navy-light: #F0F4F8;
      --emerald: #047857;
      --emerald-bg: #ECFDF5;
      --amber: #B45309;
      --slate-dark: #0F172A;
      --slate-muted: #64748B;
      --border: #E2E8F0;
    }

    /* Header e Footer de Página */
    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid var(--border);
      padding-bottom: 3mm;
      margin-bottom: 5mm;
    }
    .top-header .brand {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .top-header .brand img {
      width: 20px;
      height: 20px;
      border-radius: 4px;
    }
    .top-header .brand-title {
      font-size: 11pt;
      font-weight: 800;
      color: var(--slate-dark);
      letter-spacing: -0.3px;
    }
    .top-header .brand-mote {
      font-size: 7pt;
      font-weight: 800;
      color: var(--navy);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-left: 6px;
    }
    .top-header .meta {
      font-size: 7.5pt;
      color: var(--slate-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .page-footer {
      border-top: 1px solid var(--border);
      padding-top: 2.5mm;
      margin-top: 4mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: var(--slate-muted);
    }
    .page-footer b { color: var(--navy); font-weight: 700; }

    /* Tipografia e Títulos */
    h1 {
      font-size: 19pt;
      font-weight: 800;
      color: var(--slate-dark);
      line-height: 1.15;
      letter-spacing: -0.5px;
      margin-bottom: 2mm;
    }
    .lead {
      font-size: 9.5pt;
      color: #334155;
      line-height: 1.4;
      margin-bottom: 4mm;
    }
    h2 {
      font-size: 12pt;
      font-weight: 700;
      color: var(--navy);
      margin-bottom: 2.5mm;
      display: flex;
      align-items: center;
      gap: 5px;
      border-left: 3px solid var(--navy);
      padding-left: 6px;
    }
    h3 {
      font-size: 9.5pt;
      font-weight: 700;
      color: var(--slate-dark);
      margin-bottom: 1.5mm;
    }
    p { margin-bottom: 2.5mm; }

    /* Grid e Cards */
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
    .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3mm; }
    .grid4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 2.5mm; }

    .card {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 3mm 3.5mm;
    }
    .card.highlight {
      background: var(--navy-light);
      border-color: #BFDBFE;
    }
    .card.success {
      background: var(--emerald-bg);
      border-color: #A7F3D0;
    }

    .kpi {
      text-align: center;
      padding: 3mm 2mm;
      background: #F8FAFC;
      border: 1px solid var(--border);
      border-radius: 6px;
    }
    .kpi .val {
      font-size: 15pt;
      font-weight: 800;
      color: var(--slate-dark);
      line-height: 1;
    }
    .kpi .val.navy { color: var(--navy); }
    .kpi .val.green { color: var(--emerald); }
    .kpi .lbl {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--slate-muted);
      margin-top: 1.5mm;
    }
    .kpi .sub {
      font-size: 6.5pt;
      color: #64748B;
      margin-top: 0.5mm;
    }

    /* Tabelas */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-top: 2mm;
      margin-bottom: 3mm;
    }
    th {
      background: #F8FAFC;
      color: var(--slate-muted);
      font-weight: 700;
      text-align: left;
      padding: 5px 8px;
      border: 1px solid var(--border);
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 5px 8px;
      border: 1px solid var(--border);
      color: #334155;
    }
    tr.hl { background: var(--navy-light); font-weight: 600; }
    td.navy { color: var(--navy); font-weight: 700; }
    td.green { color: var(--emerald); font-weight: 700; }

    /* Imagens */
    .img-showcase {
      width: 100%;
      height: 140px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid var(--border);
      display: block;
    }
    .img-box { position: relative; }
    .img-caption {
      position: absolute;
      bottom: 6px;
      left: 6px;
      right: 6px;
      background: rgba(15, 23, 42, 0.85);
      color: #FFFFFF;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 7pt;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
    }

    .report-img {
      width: 100%;
      height: auto;
      border-radius: 6px;
      border: 1px solid var(--border);
      box-shadow: 0 4px 10px rgba(0,0,0,0.06);
      display: block;
    }

    ul.check-list { list-style: none; }
    ul.check-list li {
      position: relative;
      padding-left: 14px;
      margin-bottom: 2mm;
      font-size: 8.5pt;
      color: #334155;
    }
    ul.check-list li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: var(--emerald);
      font-weight: 800;
    }

    .badge {
      display: inline-block;
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 6.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge.navy { background: #DBEAFE; color: var(--navy); }
    .badge.green { background: #D1FAE5; color: var(--emerald); }
  </style>
</head>
<body>

  <!-- ══════════════════════════════════════════════════════════════ -->
  <!-- PÁGINA 1: CAPA & APRESENTAÇÃO INSTITUCIONAL                    -->
  <!-- ══════════════════════════════════════════════════════════════ -->
  <div class="page">
    <div>
      <div class="top-header">
        <div class="brand">
          <img src="${logoB64}" alt="finHouse Logo">
          <span class="brand-title">finHouse</span>
          <span class="brand-mote">· VENDE E ALUGA MELHOR</span>
        </div>
        <div class="meta">Guia do Proprietário · Short Stay 2026</div>
      </div>

      <div style="margin-bottom: 4mm;">
        <span class="badge navy" style="margin-bottom: 1.5mm;">Resumo Comercial para Proprietários de Imóveis</span>
        <h1>Administração Profissional de Aluguel por Temporada</h1>
        <p class="lead">
          Como maximizar o rendimento do seu imóvel em São Paulo ou no Litoral com a gestão completa da <strong>finHouse</strong>: precificação dinâmica diária, padrão hoteleiro e repasse direto em conta por uma taxa justa de <strong>12%</strong>.
        </p>
      </div>

      <!-- 4 KPIs de Autoridade -->
      <div class="grid4" style="margin-bottom: 5mm;">
        <div class="kpi">
          <div class="val navy">12%</div>
          <div class="lbl">Taxa de Gestão</div>
          <div class="sub">Mercado cobra 15% a 25%</div>
        </div>
        <div class="kpi">
          <div class="val">79,5%</div>
          <div class="lbl">Ocupação Copan SP</div>
          <div class="sub">Média região: ~61%</div>
        </div>
        <div class="kpi">
          <div class="val" style="color:#B45309;">4,92★</div>
          <div class="lbl">Superhost / 5.0</div>
          <div class="sub">+100 avaliações no ano</div>
        </div>
        <div class="kpi">
          <div class="val green">R$ 0</div>
          <div class="lbl">Adesão / Mensalidade</div>
          <div class="sub">Sem taxa de setup</div>
        </div>
      </div>

      <!-- Vitrine Dupla: Copan e Riviera de São Lourenço -->
      <h2>1. Portfólio Ativo & Expertise Multilocação Prime</h2>
      <p style="font-size:8.5pt; color:#475569; margin-bottom: 3mm;">
        Diferente de administradores amadores ou gestoras restritas a um único edifício, a <strong>finHouse</strong> domina as duas dinâmicas imobiliárias mais rentáveis de São Paulo: o turismo corporativo/cultural na capital e a alta temporada de praia no litoral.
      </p>

      <div class="grid2" style="margin-bottom: 5mm;">
        <div class="img-box">
          <img src="${copanB64}" class="img-showcase" alt="Edifício Copan São Paulo">
          <div class="img-caption">
            <span>Edifício Copan · Centro SP</span>
            <span>79,5% Ocupação · R$ 265 ADR</span>
          </div>
        </div>
        <div class="img-box">
          <img src="${rivieraB64}" class="img-showcase" alt="Flats na Riviera de São Lourenço">
          <div class="img-caption">
            <span>Flats na Riviera · Litoral SP</span>
            <span>74–78% Ocupação · R$ 156k/ano</span>
          </div>
        </div>
      </div>

      <h2>2. Por Que o Short Stay Supera o Aluguel Tradicional?</h2>
      <div class="grid3">
        <div class="card">
          <h3>Até 50% Maior Rentabilidade*</h3>
          <p style="font-size:8pt; color:#475569;">Diárias calibradas hora a hora acompanhando eventos, feriados e demanda local, superando a rentabilidade estática do aluguel de 30 meses.</p>
        </div>
        <div class="card">
          <h3>Patrimônio Sempre Valorizado</h3>
          <p style="font-size:8pt; color:#475569;">Higienização hoteleira e vistoria criteriosa a cada saída. Seu imóvel é mantido no mais alto padrão de conservação, sem o desgaste típico de inquilinos de longo prazo.</p>
        </div>
        <div class="card">
          <h3>Flexibilidade Total</h3>
          <p style="font-size:8pt; color:#475569;">Você pode bloquear datas para usar o imóvel para suas próprias estadias ou pedir rescisão sem multas, honrando apenas as reservas já confirmadas.</p>
        </div>
      </div>

      <div style="font-size:6.5pt; color:#64748B; margin-top:3mm; line-height:1.35; border-top:1px solid #E2E8F0; padding-top:1.5mm;">
        *Projeção estimada com base no histórico real dos imóveis geridos e benchmarks do mercado de locação de São Paulo e Litoral. A rentabilidade real pode variar conforme localização, padrão de acabamento, sazonalidade, taxa de ocupação e condições de mercado.
      </div>
    </div>

    <div class="page-footer">
      <span><b>finHouse</b> · Resumo para Proprietários · Short Stay</span>
      <span>Página 1 de 4</span>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════ -->
  <!-- PÁGINA 2: O QUE OFERECEMOS (ESCOPO COMPLETO DOS 12%)          -->
  <!-- ══════════════════════════════════════════════════════════════ -->
  <div class="page">
    <div>
      <div class="top-header">
        <div class="brand">
          <img src="${logoB64}" alt="finHouse Logo">
          <span class="brand-title">finHouse</span>
          <span class="brand-mote">· VENDE E ALUGA MELHOR</span>
        </div>
        <div class="meta">Escopo Operacional & Segurança</div>
      </div>

      <h2>3. O Que Oferecemos: Gestão 360 Graus sem Preocupações</h2>
      <p class="lead" style="margin-bottom:3mm;">
        Você é o proprietário dos rendimentos; a <strong>finHouse</strong> é a dona da operação, do suporte aos hóspedes e das notas 5 estrelas.
      </p>

      <div class="grid2" style="margin-bottom: 4mm;">
        <div class="card">
          <h3>📸 Produção Fotográfica & Anúncio Superhost</h3>
          <p style="font-size:8pt; color:#475569;">Ensaio fotográfico com enquadramentos focados em conversão de cliques, copy persuasiva em português e inglês e anúncio ranqueado com selo Superhost no Airbnb e Genius no Booking.</p>
        </div>
        <div class="card">
          <h3>📈 Precificação Dinâmica Diária</h3>
          <p style="font-size:8pt; color:#475569;">Algoritmos de inteligência de dados que modulam a diária diariamente conforme demanda, feriados e ocupação de concorrentes. Máximo RevPAR (receita por quarto disponível).</p>
        </div>
        <div class="card">
          <h3>💬 Atendimento aos Hóspedes 24/7</h3>
          <p style="font-size:8pt; color:#475569;">Tempo de resposta médio inferior a 15 minutos. Suporte pré-reserva, envio de instruções de chegada, dúvidas durante a estadia e checkout, em múltiplos idiomas.</p>
        </div>
        <div class="card">
          <h3>🔑 Fechaduras Digitais & Check-in Ágil</h3>
          <p style="font-size:8pt; color:#475569;">Instalação e gestão de senhas temporárias automáticas para cada reserva. Sem entrega presencial de chaves e sem risco de cópias indevidas.</p>
        </div>
        <div class="card">
          <h3>✨ Governança com Padrão Hoteleiro</h3>
          <p style="font-size:8pt; color:#475569;">Coordenação de equipe de limpeza treinada, lavanderia industrial para enxovais de alto padrão e reposição contínua de amenities de banho e higiene para notas 5 estrelas.</p>
        </div>
        <div class="card">
          <h3>🔍 Vistoria de Zelo & Padrão 5 Estrelas</h3>
          <p style="font-size:8pt; color:#475569;">Checklist rigoroso a cada check-out para assegurar que cada detalhe permaneça em ordem, mantendo o imóvel impecável e os hóspedes sempre satisfeitos.</p>
        </div>
      </div>

      <h2>4. Segurança Condominial & Regras Rígidas</h2>
      <div class="card highlight" style="margin-bottom: 4mm;">
        <p style="font-size:8.5pt; color:#1E3A8A; font-weight:600; margin-bottom:1.5mm;">
          Proteção para o seu patrimônio, para os vizinhos e para o condomínio:
        </p>
        <ul class="check-list">
          <li><strong>Cadastro Prévio de Hóspedes:</strong> Exigência de documento oficial com foto de todos os ocupantes e envio formal da lista para a portaria/administração predial antes de cada check-in.</li>
          <li><strong>Filtro Rigoroso de Perfis:</strong> Aceitamos apenas hóspedes com avaliações positivas nas plataformas. Bloqueio automático de perfis sem verificação de identidade.</li>
          <li><strong>Respeito Estrito à Convenção Predial:</strong> Proibição expressa de festas, som alto, aglomerações, visitas não autorizadas e fumo dentro das unidades.</li>
          <li><strong>Controle Inteligente de Acessos:</strong> Troca de senha da fechadura eletrônica a cada estadia, garantindo que apenas os hóspedes cadastrados acessem o imóvel no período contratado.</li>
        </ul>
      </div>

      <h2>5. O Que NÃO Oferecemos (Transparência Absoluta)</h2>
      <div class="grid3">
        <div class="card">
          <h3>Sem Custos Imprevistos</h3>
          <p style="font-size:7.5pt; color:#64748B;">Nossa gestão é focada na sua rentabilidade líquida. Nenhuma despesa ou intervenção extraordinária é feita sem a sua prévia concordância.</p>
        </div>
        <div class="card">
          <h3>Sem Contrato de 30 Meses</h3>
          <p style="font-size:7.5pt; color:#64748B;">Você tem total liberdade para pausar ou rescindir o contrato quando quiser, respeitando apenas o calendário de hóspedes já confirmados.</p>
        </div>
        <div class="card">
          <h3>Sem Taxa Oculta de Boleto</h3>
          <p style="font-size:7.5pt; color:#64748B;">Condomínio, IPTU e luz continuam em nome do proprietário. Não cobramos taxa sobre o pagamento das suas despesas fixas.</p>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span><b>finHouse</b> · Resumo para Proprietários · Short Stay</span>
      <span>Página 2 de 4</span>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════ -->
  <!-- PÁGINA 3: NOSSOS PREÇOS, DIVISÃO & O PORTAL DO PROPRIETÁRIO    -->
  <!-- ══════════════════════════════════════════════════════════════ -->
  <div class="page">
    <div>
      <div class="top-header">
        <div class="brand">
          <img src="${logoB64}" alt="finHouse Logo">
          <span class="brand-title">finHouse</span>
          <span class="brand-mote">· VENDE E ALUGA MELHOR</span>
        </div>
        <div class="meta">Preços, Split & Transparência Web</div>
      </div>

      <h2>6. Nossa Taxa: Apenas 12% Fixo (Você Economiza até 40%)</h2>
      <p style="font-size:8.5pt; color:#334155; margin-bottom:2.5mm;">
        Enquanto administradoras tradicionais cobram 15%, 20% ou até 25% das diárias, a <strong>finHouse</strong> pratica a taxa fixa de <strong>12%</strong> sobre o valor líquido das diárias repassado pelas plataformas.
      </p>

      <!-- Simulação de Reserva -->
      <div class="card" style="margin-bottom: 4mm;">
        <h3 style="color:var(--navy);">Exemplo Prático: Reserva de 5 Noites (Studio SP / Litoral)</h3>
        <table>
          <thead>
            <tr>
              <th>Item Financeiro</th>
              <th>Valor Bruto</th>
              <th>Quem Paga / Destino</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Diárias (5 noites x R$ 260)</td>
              <td>R$ 1.300,00</td>
              <td>Pago pelo hóspede</td>
            </tr>
            <tr>
              <td>Taxa de Limpeza</td>
              <td>R$ 140,00</td>
              <td>Pago 100% pelo hóspede (repassado integralmente à equipe de governança)</td>
            </tr>
            <tr>
              <td>Taxa da Plataforma (~15% Airbnb/Booking)</td>
              <td>- R$ 195,00</td>
              <td>Retida diretamente pelo canal de vendas</td>
            </tr>
            <tr class="hl">
              <td><strong>Valor Líquido de Diárias das Plataformas</strong></td>
              <td><strong>R$ 1.105,00</strong></td>
              <td>Base para o split entre proprietário e administradora</td>
            </tr>
            <tr>
              <td>Taxa de Gestão finHouse (12%)</td>
              <td>- R$ 132,60</td>
              <td>Recebido pela finHouse com emissão de nota fiscal de serviço</td>
            </tr>
            <tr style="background:#ECFDF5; font-size:9pt;">
              <td><strong style="color:var(--emerald);">Líquido Depositado ao Proprietário</strong></td>
              <td><strong style="color:var(--emerald);">R$ 972,40</strong></td>
              <td><strong style="color:var(--emerald);">88% do valor líquido direto na sua conta bancária</strong></td>
            </tr>
          </tbody>
        </table>
        <p style="font-size:7pt; color:#64748B; margin-top:1mm;">*Em concorrentes que cobram 15% a 20%, o proprietário receberia de R$ 884 a R$ 939 pela mesma estadia. A finHouse deixa milhares de reais a mais no seu bolso todo ano.</p>
      </div>

      <h2>7. Forma de Recebimento: Split Automático & Repasse com DRE</h2>
      <div class="grid2" style="margin-bottom: 4mm;">
        <div class="card highlight">
          <h3>💳 Airbnb: Split Direto em 48h</h3>
          <p style="font-size:8pt; color:#1E3A8A;">A divisão é feita pela própria plataforma. O Airbnb deposita <strong>88%</strong> na sua conta bancária em até 48h após a entrada de cada hóspede. Você é cadastrado como co-anfitrião e acompanha valores em tempo real.</p>
        </div>
        <div class="card highlight">
          <h3>📑 Booking & Direto: Repasse Mensal com DRE</h3>
          <p style="font-size:8pt; color:#1E3A8A;">Nas reservas de Booking e vendas diretas, o valor é consolidado e transferido via repasse mensal no início de cada mês, acompanhado do relatório analítico e DRE completa.</p>
        </div>
      </div>

      <h2>8. Diferencial Exclusivo: Portal do Proprietário em Tempo Real</h2>
      <p style="font-size:8.5pt; color:#334155; margin-bottom:2.5mm;">
        Você recebe um <strong>link web exclusivo</strong> para acompanhar no celular ou computador cada reserva, receita diária, notas fiscais e conciliação bancária:
      </p>

      <div style="border: 1px solid var(--border); border-radius: 6px; overflow: hidden; margin-bottom: 2mm;">
        <img src="${reportB64}" class="report-img" alt="Portal do Proprietário finHouse">
      </div>
    </div>

    <div class="page-footer">
      <span><b>finHouse</b> · Resumo para Proprietários · Short Stay</span>
      <span>Página 3 de 4</span>
    </div>
  </div>

  <!-- ══════════════════════════════════════════════════════════════ -->
  <!-- PÁGINA 4: RESULTADOS AUDITADOS, CONTRATO & CONTATO             -->
  <!-- ══════════════════════════════════════════════════════════════ -->
  <div class="page">
    <div>
      <div class="top-header">
        <div class="brand">
          <img src="${logoB64}" alt="finHouse Logo">
          <span class="brand-title">finHouse</span>
          <span class="brand-mote">· VENDE E ALUGA MELHOR</span>
        </div>
        <div class="meta">Cases Auditados & Contato</div>
      </div>

      <h2>9. Histórico Comprovado da finHouse (Dados Reais bnbmanager)</h2>
      <p style="font-size:8.5pt; color:#475569; margin-bottom:2.5mm;">
        Resultados reais extraídos do nosso sistema de inteligência financeira de locação:
      </p>

      <div class="grid2" style="margin-bottom: 4mm;">
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5mm;">
            <h3 style="margin:0;">Edifício Copan · São Paulo</h3>
            <span class="badge navy">Urbano SP</span>
          </div>
          <table style="margin:0;">
            <tr><td>Taxa de Ocupação</td><td class="navy">79,5% (vs. 61% República)</td></tr>
            <tr><td>Diária Média (ADR)</td><td>R$ 265 a R$ 310</td></tr>
            <tr><td>Avaliação Plataformas</td><td>4,92 / 5.0 · Superhost</td></tr>
            <tr><td>Giro Mensal</td><td>~8 reservas por mês</td></tr>
          </table>
        </div>

        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5mm;">
            <h3 style="margin:0;">Flats na Riviera · Bertioga</h3>
            <span class="badge green">Lazer / Praia</span>
          </div>
          <table style="margin:0;">
            <tr><td>Taxa de Ocupação Anual</td><td class="green">74% a 78% (vs. 46% Bertioga)</td></tr>
            <tr><td>Diária Média Anual</td><td>R$ 550 (R$ 1.200 verão)</td></tr>
            <tr><td>Faturamento Anual</td><td>R$ 156,7 mil por unidade</td></tr>
            <tr><td>Resultado Líquido Caixa</td><td>R$ 83,8 mil/ano (~9,3% yield)</td></tr>
          </table>
        </div>
      </div>

      <h2>10. Comparativo Direto de Modelos</h2>
      <table>
        <thead>
          <tr>
            <th>Pilar de Gestão</th>
            <th style="background:#DBEAFE; color:var(--navy);">finHouse (12%)</th>
            <th>Outras Administradoras</th>
            <th>Administrar Sozinho</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Taxa de Gestão</strong></td>
            <td class="navy">12% fixo</td>
            <td>15% a 25% + setup</td>
            <td>0% (perde em vacância)</td>
          </tr>
          <tr>
            <td><strong>Recebimento</strong></td>
            <td class="green">Split (Airbnb) ou Repasse (Booking)</td>
            <td>Retido por 30 a 45 dias</td>
            <td>Recebe e concilia na mão</td>
          </tr>
          <tr>
            <td><strong>Trabalho do Dono</strong></td>
            <td class="green">Zero (100% passivo)</td>
            <td>2h a 5h/mês (burocracia)</td>
            <td>15h a 25h/semana (estresse 24/7)</td>
          </tr>
          <tr>
            <td><strong>Relatório & DRE</strong></td>
            <td class="navy">Portal web tempo real + DRE</td>
            <td>PDF estático mensal</td>
            <td>Planilhas manuais na mão</td>
          </tr>
          <tr>
            <td><strong>Precificação & Canais</strong></td>
            <td class="navy">Multicanal + Algoritmo diário</td>
            <td>1 canal + tabela fixa</td>
            <td>Preço intuitivo + risco overbooking</td>
          </tr>
          <tr>
            <td><strong>Ocupação Auditada</strong></td>
            <td class="green">74% a 80%</td>
            <td>60% a 68%</td>
            <td>45% a 55%</td>
          </tr>
        </tbody>
      </table>

      <h2>11. Contrato & Próximos Passos</h2>
      <div class="card highlight" style="margin-bottom: 4mm;">
        <p style="font-size:8.5pt; color:#1E3A8A; line-height:1.45;">
          <strong>Sem carência ou fidelidade forçada:</strong> Você pode rescindir a qualquer momento sem multa, apenas honrando as reservas de hóspedes já confirmadas (janela de até 90 dias).
        </p>
      </div>

      <!-- CTA Box -->
      <div style="background:var(--navy); color:#FFFFFF; padding:4mm 5mm; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-size:11pt; font-weight:800; letter-spacing:-0.2px;">Solicite a Avaliação Gratuita do Seu Imóvel</div>
          <div style="font-size:8pt; color:#BFDBFE; margin-top:0.5mm;">Calculamos a receita projetada para o seu imóvel com base no histórico do bnbmanager.</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:10pt; font-weight:800;">(11) 95584-2951</div>
          <div style="font-size:7.5pt; color:#BFDBFE;">contato@finhouse.com.br · finhouse.com.br/bnb</div>
        </div>
      </div>

      <div style="font-size:6.5pt; color:#64748B; margin-top:2.5mm; line-height:1.3; border-top:1px solid #E2E8F0; padding-top:1.5mm;">
        *Dados históricos apurados pelo sistema de gestão bnbmanager. Projeções e rentabilidades passadas não constituem garantia de rendimentos futuros. Valores sujeitos a variações sazonais e de mercado.
      </div>
    </div>

    <div class="page-footer">
      <span><b>finHouse</b> · Resumo para Proprietários · Short Stay</span>
      <span>Página 4 de 4</span>
    </div>
  </div>

</body>
</html>`;

fs.writeFileSync(OUT_HTML, html, 'utf8');
console.log('HTML Teaser written to:', OUT_HTML);

// Gerar PDF usando o Microsoft Edge headless
const browsers = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
];
const exe = browsers.find((b) => fs.existsSync(b));
if (exe) {
  execFileSync(exe, [
    '--headless=new',
    '--disable-gpu',
    '--no-pdf-header-footer',
    '--virtual-time-budget=8000',
    `--print-to-pdf=${OUT_PDF}`,
    'file:///' + OUT_HTML.replace(/\\/g, '/')
  ], { stdio: 'inherit' });

  console.log('PDF Teaser generated at:', OUT_PDF);
  if (fs.existsSync(OUT_PDF)) {
    console.log('PDF Size:', fs.statSync(OUT_PDF).size, 'bytes');
    fs.copyFileSync(OUT_PDF, PUBLIC_DEST);
    console.log('Copied PDF to public folder:', PUBLIC_DEST);
  }
} else {
  console.log('Browser not found for PDF export.');
}
