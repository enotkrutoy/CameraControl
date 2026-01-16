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
      text: `ACT AS A PROFESSIONAL PHOTOGRAPHER AND PERSPECTIVE ARTIST. 
      Re-render this image following these spatial modifications: ${cameraPrompt}. 
      
      CRITICAL INSTRUCTIONS:
      1. Keep the main subject (the object) IDENTICAL in design, texture, and branding.
      2. If floating/levitation is requested, ensure the object is clearly 50 centimeters in the air.
      3. A CRITICAL element for levitation: Render a soft, accurate contact shadow (ambient occlusion) on the ground directly beneath the object to realistically show its height.
      4. Maintain the background environment, floor tiling, and lighting perfectly.
      5. Use the provided seed ${settings.seed} for deterministic results.
      6. The final image should look like a single continuous high-end photograph with zero artifacts.`
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