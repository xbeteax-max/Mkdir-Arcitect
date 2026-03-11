
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedStructure } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const generateStructure = async (prompt: string): Promise<GeneratedStructure> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a comprehensive and professional folder structure for a project based on this description: "${prompt}". Return only the root folder and its nested children.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "The name of the folder",
          },
          children: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING } } } } } } }
              }
            },
            description: "Nested folders",
          },
        },
        required: ["name"],
      },
    },
  });

  const jsonStr = response.text.trim();
  return JSON.parse(jsonStr) as GeneratedStructure;
};
