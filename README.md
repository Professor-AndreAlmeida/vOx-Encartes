# vOx Encartes 🛒✨

> **Transforme Encartes Estáticos em Ativos Digitais com Inteligência Artificial.**

![Status](https://img.shields.io/badge/Status-Beta-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![AI](https://img.shields.io/badge/Powered%20by-Gemini%202.5-purple)

**vOx Encartes** é uma aplicação web **Open Source** e **Local-First** projetada para automatizar o fluxo de trabalho de profissionais de marketing, e-commerce e varejo. O sistema extrai, trata e cataloga produtos a partir de encartes promocionais (PDF/Imagens) utilizando o poder da IA Generativa.

Tudo roda diretamente no seu navegador, garantindo **privacidade total** e **custo zero** de infraestrutura (Serverless).

---

## 🚀 Funcionalidades Principais

### 🧠 Inteligência Artificial Generativa (BYOK)
O sistema utiliza sua própria chave de API do **Google Gemini** (Modelo *Bring Your Own Key*).
- **Gemini 2.5 Flash Image:** Para edições visuais complexas, remoção de fundo e estilização.
- **Gemini 2.5 Flash:** Para OCR rápido e leitura de preços/nomes de produtos.

### 🏠 Arquitetura Local-First
Não possuímos banco de dados na nuvem.
- **IndexedDB:** Todas as imagens, recortes e histórico de edições são salvos no banco de dados do seu navegador.
- **Privacidade:** Seus dados nunca saem do seu dispositivo, exceto para o processamento momentâneo na API do Google.

### 📄 Suporte Avançado a Arquivos
- **PDF Multipáginas:** O sistema lê PDFs, gera miniaturas de todas as páginas e permite selecionar qual página processar em alta resolução.
- **Formatos de Imagem:** Suporte nativo para JPG, PNG e WebP.

### ✂️ Workspace de Extração Profissional
Uma área de trabalho estilo "Photoshop" no navegador:
- **Zoom & Pan:** Navegue por encartes gigantes com facilidade usando zoom (scroll) e ferramenta de mão (espaço).
- **Seleção Precisa:** Recorte produtos com precisão de pixel.
- **OCR Automático:** Ao recortar, a IA tenta identificar automaticamente o nome do produto e o preço.

### 🎨 Estúdio de Criação IA (Editor Não-Linear)
Um editor poderoso onde você conversa com a IA para alterar a imagem:
- **Tratamento:** Remover fundo, limpar textos (inpainting), melhorar iluminação de estúdio.
- **Estilo:** Vetorização (Flat Design), Filtros Retrô, Desenho Técnico.
- **Marketing:** Adicionar selos de oferta, etiquetas de preço e efeitos de destaque "Hero".
- **Histórico de Sessão:** Crie múltiplas versões da mesma imagem em cadeia (Chaining) e salve apenas a melhor.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído com uma stack moderna e performática:

- **Frontend:** React 19, TypeScript, Vite.
- **Estilização:** Tailwind CSS, Lucide React (Ícones).
- **IA Integration:** Google GenAI SDK for Web (`@google/genai`).
- **Processamento de PDF:** PDF.js.
- **Storage:** IndexedDB (Nativo).

---

## ⚡ Guia de Instalação e Execução

### Pré-requisitos
- Node.js (v18 ou superior)
- Gerenciador de pacotes (NPM ou Yarn)
- Uma API Key do Google AI Studio

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/Professor-AndreAlmeida/vOx-Encartes.git
   cd vOx-Encartes
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Execute o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador**
   Abra `http://localhost:5173` (ou a porta indicada no terminal).

---

## 🔑 Configuração (Primeiro Acesso)

Ao abrir o sistema pela primeira vez, você verá a tela de **Onboarding**.

1. Gere sua chave gratuitamente no [Google AI Studio](https://aistudio.google.com/app/api-keys).
2. Insira a chave no campo solicitado.
3. (Opcional) Escolha seu nome de usuário.
4. Pronto! O sistema salvará a chave criptografada no seu navegador.

> **Dica:** Você pode alterar o modelo de IA (ex: testar o `Gemini 3.0 Pro`) no menu de **Configurações**.

---

## 🤝 Como Contribuir

O vOx Encartes é um projeto comunitário. Quer ajudar?

1. Faça um **Fork** do projeto.
2. Crie uma **Branch** para sua feature (`git checkout -b feature/NovaFeature`).
3. Commit suas mudanças (`git commit -m 'Adicionando suporte a X'`).
4. Push para a Branch (`git push origin feature/NovaFeature`).
5. Abra um **Pull Request**.

---

## 📝 Licença

Este projeto está sob a licença **MIT**. Sinta-se livre para usar, modificar e distribuir.

---

Desenvolvido com ❤️ por **Professor André Almeida**.
