const fs = require('fs');
const path = 'c:/Users/rafae/Documents/FINHOUSE/SITES/finhouse_oficial/src/app/bnb/page.tsx';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Copiar RESUMO_PROPRIETARIOS_TEASER.md para public
  fs.copyFileSync(
    'c:/Users/rafae/Documents/FINHOUSE/SITES/bnbmanager/paper/RESUMO_PROPRIETARIOS_TEASER.md',
    'c:/Users/rafae/Documents/FINHOUSE/SITES/finhouse_oficial/public/bnb/RESUMO_PROPRIETARIOS_TEASER.md'
  );

  // 1. Substituir AirCover por Segurança & Preservação Patrimonial
  content = content.replace(
    'title: "Proteção Patrimonial & AirCover",\n                  desc: "Filtro prévio de perfil de hóspedes, cobrança de caução quando aplicável e acionamento de seguro de danos das plataformas (AirCover).",',
    'title: "Segurança & Preservação Patrimonial",\n                  desc: "Triagem rigorosa de hóspedes por documento oficial com foto, envio prévio para a portaria e respeito integral ao regulamento do condomínio.",'
  );

  // 2. Suavizar Vistoria & Pequenas Manutenções
  content = content.replace(
    'title: "Vistoria & Pequenas Manutenções",\n                  desc: "Inspeção técnica em cada saída. Reparos elétricos e hidráulicos simples resolvidos rapidamente para manter o calendário sempre ativo.",',
    'title: "Vistoria de Zelo & Padrão 5 Estrelas",\n                  desc: "Inspeção minuciosa a cada check-out para assegurar que cada item permaneça impecável, preservando o valor e o padrão do seu patrimônio.",'
  );

  // 3. Adicionar asterisco e rodapé explicativo de mercado no comparativo
  if (!content.includes('*Projeção estimada com base no histórico real')) {
    content = content.replace(
      'Com taxa de 12% e ocupação até 30% maior que a média, seu rendimento líquido supera tanto administrar sozinho quanto gestoras tradicionais.',
      'Com taxa de 12% e ocupação até 30% maior que a média, seu rendimento líquido supera tanto administrar sozinho quanto gestoras tradicionais.*'
    );
    content = content.replace(
      '</section>\n\n        {/* ─── NOVA SEÇÃO: PORTAL DO PROPRIETÁRIO',
      '  <div className="mt-3 text-[11px] text-[#64748B] text-center">\n              *Projeção estimada com base no histórico real dos imóveis geridos e benchmarks do mercado local. A rentabilidade real pode variar conforme localização, decoração, sazonalidade e condições de mercado.\n            </div>\n          </div>\n        </section>\n\n        {/* ─── NOVA SEÇÃO: PORTAL DO PROPRIETÁRIO'
    );
  }

  // 4. Adicionar botão para baixar o Teaser em PDF na seção do portal
  if (!content.includes('FINHOUSE_Resumo_Proprietarios.pdf')) {
    content = content.replace(
      'Quero gerir meu imóvel com essa transparência\n                    <ArrowRight className="w-4 h-4" />\n                  </a>\n                </div>',
      'Quero gerir meu imóvel com essa transparência\n                    <ArrowRight className="w-4 h-4" />\n                  </a>\n                  <a\n                    href="/bnb/FINHOUSE_Resumo_Proprietarios.pdf"\n                    target="_blank"\n                    rel="noopener noreferrer"\n                    className="w-full py-3 px-5 rounded-full bg-white hover:bg-[#F1F5F9] text-[#0F3B78] border border-[#CBD5E1] text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"\n                  >\n                    <FileCheck2 className="w-4 h-4" />\n                    Baixar Resumo para Proprietários (PDF)\n                  </a>\n                </div>'
    );
  }

  fs.writeFileSync(path, content, 'utf8');
  console.log('page.tsx successfully updated!');
} else {
  console.log('File not found:', path);
}
