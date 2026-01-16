
import { GoogleGenAI } from "@google/genai";
import { ImageData, GenerationSettings } from "../types";

export class GeminiService {
  /**
   * Generates an edited image based on camera prompts.
   */
  async generateImage(
    sourceImage: ImageData,
    cameraPrompt: string,
    settings: GenerationSettings
  ): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const imagePart = {
      inlineData: {
        mimeType: sourceImage.mimeType,
        data: sourceImage.base64.split(',')[1],
      },
    };

    const textPart = {
      text: `ACT AS A PROFESSIONAL PHOTOGRAPHER. 
      Re-render this image following these spatial modifications: ${cameraPrompt}. 
      
      CRITICAL INSTRUCTIONS:
      1. Keep the main subject (the object) identical in design, texture, and branding.
      2. If floating/levitation is requested, ensure the object is clearly in the air with a soft shadow on the floor below it to indicate elevation.
      3. Maintain the background environment, lighting, and floor tiling perfectly.
      4. Use the provided seed ${settings.seed} for deterministic results.
      5. The final image should look like a single continuous shot with zero artifacts.`
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
    });

    let imageUrl = '';
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) throw new Error("Perspective transformation failed. No image returned from model.");
    return imageUrl;
  }
}

export const geminiService = new GeminiService();
