# bnbmanager — Gestão & DRE de Locação por Temporada

Sistema web de controle financeiro e operacional para locação por temporada (Airbnb / Booking / Direto), replicando fielmente a planilha de gestão do **Edifício Copan (4 Cotistas)**, desenvolvido com **Next.js** e estilizado no padrão **shadcn/ui Finance** (clean / light mode).

---

## 🚀 Como Executar Localmente

### Opção 1: Atalho de 1 Clique (Windows)
Dê um duplo clique no arquivo:
```
iniciar_bnbmanager.bat
```
Ele abrirá automaticamente o navegador em `http://localhost:3000`.

### Opção 2: Linha de Comando
```bash
npm install
npm run dev
```
Acesse `http://localhost:3000`.

---

## ☁️ Como Fazer Deploy na Vercel

O projeto foi construído no padrão nativo do Next.js sem dependências de servidores externos ou banco de dados obrigatório:

1. Suba esta pasta para um repositório no seu GitHub.
2. Acesse [vercel.com](https://vercel.com) e clique em **Add New Project**.
3. Selecione o repositório e clique em **Deploy**.
4. Pronto! Você terá um link público seguro (ex: `bnbmanager.vercel.app`) para compartilhar com seus sócios.

---

## 📊 Funcionalidades

* **DRE Operacional AS IS:** Tabela idêntica à aba `Copan_Reservas` da planilha Excel, com todos os 18 meses reais carregados (Março/2025 a Agosto/2026).
* **Visão dos Sócios:** Cards com faturamento bruto, receita líquida apurada e o **resultado por cota (1/4)** em destaque.
* **Filtros Rápidos:** Alternância instantânea entre 2025, 2026 e visão de todos os meses.
* **Importador de CSV Mensal:** Botão "Importar CSV Mensal" com drag-and-drop para subir relatórios brutos do Airbnb. O sistema filtra automaticamente as reservas do Copan e recalcula diárias, ocupação, lavanderia (-R$ 150/check-in), taxa de administração (10%) e receita líquida.
