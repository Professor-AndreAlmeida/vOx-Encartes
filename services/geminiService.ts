
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { getSettings } from "./db";

// Modelos oficiais suportados.
const ALLOWED_MODELS = [
    'gemini-2.5-flash-image', 
    'gemini-3-pro-image-preview'
];

// O modelo "DEFAULT" deve ser sempre uma string que funciona (ex: sem sufixo -preview antigo)
const DEFAULT_EDIT_MODEL = 'gemini-2.5-flash-image';
const DEFAULT_OCR_MODEL = 'gemini-2.5-flash';

const getClient = async () => {
  const settings = await getSettings();
  if (!settings || !settings.apiKey) {
    throw new Error("API Key não configurada. Por favor, configure nas opções.");
  }
  return new GoogleGenAI({ apiKey: settings.apiKey });
};

/**
 * edits an image based on a text prompt using the user's selected model.
 */
export const editProductImage = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  try {
    const ai = await getClient();
    const settings = await getSettings();
    
    // 1. Recupera o modelo salvo ou usa o padrão
    let modelName = settings?.preferredModel || DEFAULT_EDIT_MODEL;

    // 2. CRITICAL SAFETY FIX: HARD OVERRIDE
    // O erro "429 Limit: 0" ocorre especificamente com "gemini-2.5-flash-preview-image".
    // Se esse modelo específico for detectado, forçamos a troca para a versão estável IMEDIATAMENTE.
    if (modelName === 'gemini-2.5-flash-preview-image') {
        console.warn(`[Gemini Service] Bloqueando modelo depreciado '${modelName}'. Redirecionando para '${DEFAULT_EDIT_MODEL}'.`);
        modelName = DEFAULT_EDIT_MODEL;
    }

    // 3. Fallback de Segurança
    // Se o modelo não estiver na lista de permitidos (ex: typo manual, hack), reseta para o padrão.
    if (!ALLOWED_MODELS.includes(modelName)) {
        console.warn(`[Gemini Service] Modelo não permitido '${modelName}'. Usando padrão.`);
        modelName = DEFAULT_EDIT_MODEL;
    }

    console.log(`[Gemini Service] Requesting Edit with Model: ${modelName}`);

    // Clean base64 string
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    // ENGINEERING: Prompt reescrito para permitir estilização (Vetor/Cartoon) sem conflito com "Fotorealismo"
    const enhancedPrompt = `Atue como um editor profissional de imagens (Image Editing Agent).
    
    AÇÃO SOLICITADA PELO USUÁRIO: "${prompt}"

    DIRETRIZES DE EXECUÇÃO:
    1. PRIORIDADE MÁXIMA: Atenda ao estilo visual solicitado pelo usuário. Se ele pedir "Vetor", "Desenho" ou "Ilustração", IGNORE a necessidade de realismo fotográfico.
    2. Se o usuário pedir apenas correções (remover fundo, limpar texto), mantenha a integridade fotorealista e a identidade do produto.
    3. PRESERVAÇÃO: Mantenha a geometria e proporção do objeto principal, a menos que o prompt peça para alterar.
    4. SAÍDA: Gere a imagem final em alta definição (High Res).`;

    // Configure Request
    const config: any = {
        // CRITICAL: Disable safety settings to prevent false positives on commercial products
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
    };

    // If using Pro model, request higher resolution
    if (modelName === 'gemini-3-pro-image-preview') {
        config.imageConfig = { 
            imageSize: '2K' 
        };
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            text: enhancedPrompt,
          },
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64,
            },
          },
        ],
      },
      config: config
    });

    // Check for image in response
    let resultImage = null;
    
    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                resultImage = `data:image/png;base64,${part.inlineData.data}`;
                break;
            }
        }
    }

    if (!resultImage) {
        // Try to capture text failure reason if available
        const textReason = response.text || "Sem detalhes retornados pela IA.";
        console.error("Gemini Response blocked/empty:", response);
        // Throw specific error to be caught below
        throw new Error(`A IA não gerou a imagem. Resposta de texto: ${textReason}`);
    }

    return resultImage;

  } catch (error: any) {
    console.error("Gemini Image Edit Error:", error);
    
    // Build a user-friendly error but KEEP technical details for debugging
    let techDetails = "N/A";
    let userMessage = "Erro desconhecido na API.";

    if (error instanceof Error) {
        techDetails = error.message;
        
        // Map common errors to user friendly messages
        if (techDetails.includes("429")) {
             userMessage = "Cota de requisições excedida (Erro 429).";
             if (techDetails.includes("limit: 0")) {
                 userMessage += " O modelo de IA selecionado está indisponível ou sua chave não tem permissão.";
             } else {
                 userMessage += " Aguarde alguns segundos e tente novamente.";
             }
        } else if (techDetails.includes("500")) {
             userMessage = "Erro interno no servidor do Google (Erro 500). Tente novamente.";
        } else if (techDetails.includes("API key not valid")) {
             userMessage = "Sua API Key é inválida ou expirou.";
        } else if (techDetails.includes("Safety")) {
             userMessage = "A imagem foi bloqueada pelos filtros de segurança do Google.";
        } else {
             userMessage = `Falha no processamento: ${techDetails}`;
        }
    }

    // Throw an error object that contains both the pretty message and the raw details
    const finalError = new Error(userMessage);
    (finalError as any).technicalDetails = techDetails;
    throw finalError;
  }
};

/**
 * Identifies product text details from a crop.
 * FORCE usage of Flash model to save quota.
 */
export const identifyProductDetails = async (
  base64Image: string
): Promise<{ name: string; price: string }> => {
  try {
    const ai = await getClient();
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    // OPTIMIZATION: Always use 'gemini-2.5-flash' for OCR/Text tasks.
    // It is faster, cheaper (free tier limits are higher), and sufficient for text extraction.
    const modelName = DEFAULT_OCR_MODEL;
    
    console.log(`[Gemini Service] Using model for OCR: ${modelName} (Forced for Performance/Quota)`);

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            text: "Analise este recorte de produto de um encarte de supermercado. Retorne um JSON com 'name' (nome do produto ou título da oferta) e 'price' (valor numérico com símbolo da moeda, ex: R$ 10,00). Se não estiver claro, use strings vazias. A saída deve ser estritamente JSON válido.",
          },
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      }
    });

    let text = response.text || "{}";
    
    // Cleanup markdown code blocks if present
    text = text.trim();
    if (text.startsWith("```")) {
       text = text.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "");
    }

    const json = JSON.parse(text);
    return {
      name: json.name || "Produto Desconhecido",
      price: json.price || "",
    };
  } catch (error) {
    console.warn("OCR failed:", error);
    // Silent fail for OCR is better than crashing flow
    return { name: "Produto", price: "" };
  }
};
