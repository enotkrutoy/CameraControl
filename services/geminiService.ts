
import { GoogleGenAI } from "@google/genai";
import { ImageData, GenerationSettings } from "../types";
import { MODELS } from "../constants";

export class GeminiService {
  async generateImage(
    sourceImage: ImageData,
    cameraPrompt: string,
    settings: GenerationSettings
  ): Promise<string> {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error("API Key is missing. Access restricted.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const modelName = settings.quality === 'pro' ? MODELS.pro : MODELS.flash;
    
    const imagePart = {
      inlineData: {
        mimeType: sourceImage.mimeType,
        data: sourceImage.base64.split(',')[1],
      },
    };

    const creativeDirective = settings.creativeContext 
      ? `[ATMOSPHERE & STYLE OVERRIDE: ${settings.creativeContext}]`
      : "[STYLE: Maintain original image style and lighting perfectly]";

    const textPart = {
      text: `[SYSTEM: SPATIAL_TRANSFORMATION_ENGINE_V3]
      [INPUT_ANALYSIS: Precise physical reconstruction based on reference frame]
      
      Transformation Command: ${cameraPrompt}
      ${creativeDirective}
      
      TECHNICAL CONSTRAINTS:
      1. GEOMETRY: The primary subject's identity, form, and texture must be preserved with 100% fidelity.
      2. PERSPECTIVE: Recalculate all vanishing points and horizon lines based on the new camera orientation.
      3. LIGHTING: Ensure ray-traced shadows and ambient occlusion align with the new spatial coordinates.
      4. PHYSICS: If levitation is active, render soft contact shadows on the ground exactly beneath the floating object.
      5. SEED: ${settings.seed} (Deterministic noise profile).
      
      OUTPUT: High-resolution photographic masterpiece.`
    };

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [imagePart, textPart] },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
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

    if (!imageUrl) throw new Error("CRITICAL_FAULT: Visual buffer reconstruction failed.");
    return imageUrl;
  }
}

export const geminiService = new GeminiService();
