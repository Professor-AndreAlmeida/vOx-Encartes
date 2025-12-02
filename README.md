# vOx Encartes 🛒✨

> **O Estúdio de Criação Local-First para Varejo impulsionado por IA.**

![React](https://img.shields.io/badge/React-19-blue) ![Gemini](https://img.shields.io/badge/Gemini_API-v1.30-purple) ![License](https://img.shields.io/badge/License-MIT-green) ![Status](https://img.shields.io/badge/Status-Functional-success)

**vOx Encartes** é uma aplicação web progressiva projetada para automatizar o recorte, tratamento e catalogação de produtos de encartes de supermercado. Diferente de soluções SaaS tradicionais, ele roda **100% no navegador do usuário**, eliminando custos de servidor e garantindo privacidade absoluta dos dados.

---

## 🧠 Arquitetura de IA e Modelos

O sistema utiliza o SDK mais recente do Google (`@google/genai`) e orquestra diferentes modelos para tarefas específicas, otimizando custos e qualidade:

| Agente / Tarefa | Modelo Utilizado | Justificativa Técnica |
| :--- | :--- | :--- |
| **OCR & Metadados** | `gemini-2.5-flash` | Modelo multimodal otimizado para extração de texto. Rápido, leve e com alta cota gratuita para leitura de preços/nomes. |
| **Editor Visual (Padrão)** | `gemini-2.5-flash-image` | Excelente para manipulação de pixels, remoção de fundo e estilização rápida. Custo-benefício ideal. |
| **Editor Visual (Pro)** | `gemini-3.0-pro-image-preview` | Modelo de raciocínio avançado. Ativado opcionalmente para tarefas que exigem alta fidelidade ou resolução 2K. |

> **Nota:** O sistema implementa **Prompt Chaining**. Cada edição feita pelo usuário gera uma nova imagem que serve de base (input) para a próxima solicitação, permitindo ajustes incrementais complexos.

---

## 🔄 Workflow Lógico do Sistema

1.  **Ingestão (Upload/Render):**
    *   O usuário carrega um PDF ou Imagem.
    *   Se for PDF, o sistema renderiza via `PDF.js` em **escala 4.0** (Ultra High Res) para garantir que recortes pequenos tenham densidade de pixels suficiente.
2.  **Extração (Canvas Workspace):**
    *   Usuário seleciona a área do produto.
    *   O recorte é extraído via Canvas API com interpolação de alta qualidade.
3.  **Processamento Paralelo:**
    *   **Visual:** O recorte é salvo no `IndexedDB`.
    *   **Analítico (Background):** O agente OCR analisa a imagem e preenche automaticamente Nome e Preço.
4.  **Estúdio de Criação (Loop de Edição):**
    *   Usuário solicita alterações (ex: "Remover fundo", "Vetorizar").
    *   A IA gera uma nova versão. O usuário pode navegar pelo histórico (Timeline) e reverter se necessário.
5.  **Persistência & Exportação:**
    *   Todos os dados são salvos localmente.
    *   Exportação disponível em PNG individual ou pacote ZIP em lote.

---

## 📊 Análise: Prós e Contras

### ✅ Pontos Fortes (Pros)
*   **Custo Zero de Infra:** Sem backend, sem banco de dados na nuvem (AWS/Firebase), sem custos mensais fixos.
*   **Privacidade Total:** As imagens dos encartes nunca saem do computador do usuário (exceto o buffer momentâneo enviado para a API do Google para processamento).
*   **Performance:** A interface é imediata (Optimistic UI) pois não depende de fetch de dados em servidor.
*   **Qualidade de Imagem:** O pipeline de renderização de PDF foi ajustado para maximizar a nitidez, superando muitos conversores online.

### ⚠️ Limitações (Cons)
*   **Dependência de Hardware:** A renderização de PDFs pesados consome RAM do dispositivo do usuário.
*   **Limites da API (Erro 429):** No plano gratuito do Google AI Studio, o usuário pode encontrar limites de requisição (Rate Limiting) se fizer muitas edições consecutivas rapidamente.
*   **Persistência Local:** Se o usuário limpar o cache do navegador ou formatar o PC, os dados são perdidos (recomenda-se usar a função de Backup JSON do app).

---

## 🛠️ Stack Tecnológica

*   **Core:** React 19, Vite 5.
*   **Estilo:** Tailwind CSS, Lucide React.
*   **IA:** Google GenAI SDK for Web.
*   **PDF Engine:** PDF.js (Mozilla).
*   **Storage:** Native IndexedDB API.

---

## 🚀 Como Rodar Localmente

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/Professor-AndreAlmeida/vOx-Encartes.git
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    ```
3.  **Inicie o servidor:**
    ```bash
    npm run dev
    ```
4.  **Configure a API Key:**
    *   Ao abrir o app, vá em Configurações.
    *   Insira sua chave do [Google AI Studio](https://aistudio.google.com/).

---

## 🤝 Contribuição

Este é um projeto de estudo Open Source. Sinta-se à vontade para abrir Issues ou Pull Requests.



---

**Licença MIT** | Desenvolvido por [Prof. André Almeida](https://github.com/Professor-AndreAlmeida)
