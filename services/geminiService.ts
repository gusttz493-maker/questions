import { GoogleGenAI, Type } from "@google/genai";
import type { Question, SourceFile } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const questionSchema = {
  type: Type.OBJECT,
  properties: {
    question: {
      type: Type.STRING,
      description: "O texto da pergunta gerada.",
    },
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "Uma lista de 4 opções de resposta para a pergunta.",
    },
    answer: {
      type: Type.STRING,
      description: "O texto exato da resposta correta, que deve corresponder a uma das opções.",
    },
    explanation: {
      type: Type.STRING,
      description: "Uma breve explicação do porquê a resposta está correta.",
    },
  },
  required: ["question", "options", "answer", "explanation"],
};

export const generateQuestions = async (topic: string, numQuestions: number, difficulty: string, sourceFile?: SourceFile): Promise<Question[]> => {
  try {
    let prompt = `Gere ${numQuestions} questões de múltipla escolha de nível ${difficulty} sobre o tópico "${topic}". Cada questão deve ter 4 opções, uma resposta correta clara que esteja entre as opções, e uma breve explicação do porquê a resposta está correta.`;
    
    let contents: any;

    if (sourceFile) {
        prompt += `\n\nPor favor, baseie as questões estritamente no conteúdo do documento fornecido.`;
        contents = {
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: sourceFile.mimeType,
                        data: sourceFile.data,
                    },
                },
            ],
        };
    } else {
        contents = prompt;
    }


    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: questionSchema,
        },
      },
    });

    const jsonText = response.text.trim();
    const questions = JSON.parse(jsonText);
    
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("A API não retornou um formato de questão válido.");
    }

    return questions as Question[];

  } catch (error) {
    console.error("Erro ao gerar questões:", error);
    if (error instanceof Error) {
        throw new Error(`Falha ao se comunicar com a API: ${error.message}`);
    }
    throw new Error("Ocorreu um erro desconhecido ao gerar as questões.");
  }
};

export const getChatAnswer = async (doubt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Responda a seguinte dúvida de um estudante de forma clara e didática: "${doubt}"`,
      config: {
        systemInstruction: "Você é um tutor amigável e especialista em diversas áreas do conhecimento. Sua missão é ajudar os estudantes a entenderem conceitos complexos.",
      },
    });

    return response.text;
  } catch (error) {
    console.error("Erro ao obter resposta do chat:", error);
    if (error instanceof Error) {
        throw new Error(`Falha ao se comunicar com a API: ${error.message}`);
    }
    throw new Error("Ocorreu um erro desconhecido ao processar sua dúvida.");
  }
};
