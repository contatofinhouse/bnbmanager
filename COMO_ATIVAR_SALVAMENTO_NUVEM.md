# Como Ativar o Salvamento Permanente em Nuvem (Vercel Blob)

Este guia rápido explica como ativar o banco de arquivos gratuito da **Vercel** para que qualquer importação de relatório (Airbnb ou Booking) feita pelo painel `/admin` seja gravada de forma permanente e automática para todos os usuários, sem precisar de intervenção manual no código.

---

## ⏱ Tempo estimado: 1 a 2 minutos
## 💰 Custo: Gratuito (o plano Free da Vercel inclui 1 GB de Blob Storage, suficiente para dezenas de anos de relatórios)

---

## Passo a Passo

### 1. Acessar o Projeto na Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login na sua conta.
2. Na lista de projetos, clique em **`bnbmanager`**.

### 2. Criar e Conectar o Storage (Blob)
1. No menu superior do projeto, clique na aba **Storage**.
2. Clique no botão **Create Database** (ou **Connect Store**).
3. Selecione a opção **Blob** (File Storage).
4. Em *Store Name*, digite um nome (exemplo: `bnbmanager-blob`).
5. Selecione a região padrão e clique em **Create**.
6. Na tela seguinte, certifique-se de vincular a store ao projeto `bnbmanager` e selecione os ambientes: **Production**, **Preview** e **Development**.
7. Clique em **Connect**.

> **O que a Vercel faz automaticamente:** Ela cria a variável de ambiente `BLOB_READ_WRITE_TOKEN` no projeto. O código do `bnbmanager` já foi programado para detectar essa variável sozinho.

### 3. Fazer Redeploy para ativar a nova variável
1. No menu superior da Vercel, clique na aba **Deployments**.
2. No primeiro deploy da lista (o mais recente), clique no menu de **três pontinhos (...)** à direita.
3. Clique em **Redeploy**.
4. Aguarde cerca de 1 minuto até o deploy terminar.

---

## Como Saber se Deu Certo?

1. Acesse o seu painel admin online: `https://seu-dominio.vercel.app/admin`
2. No cabeçalho superior direito, o status exibirá:
   - 🟢 **Nuvem Conectada** (em verde).

A partir desse momento:
- Qualquer arquivo CSV/Excel importado e salvo pelo botão **"Salvar e Publicar na DRE"** ficará salvo na nuvem permanentemente.
- Ao atualizar a página (F5) ou abrir em outro computador ou celular, todos os dados importados permanecerão atualizados.
