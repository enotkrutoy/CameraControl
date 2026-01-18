
import { GoogleGenAI } from "@google/genai";
import { ImageData, GenerationSettings } from "../types";
import { MODELS } from "../constants";

export class GeminiService {
  async generateImage(
    sourceImage: ImageData,
    cameraPrompt: string,
    settings: GenerationSettings
  ): Promise<string> {
    // CRITICAL: Always use a fresh instance to ensure the latest API key from process.env is used.
    // Initialization must use a named parameter: new GoogleGenAI({apiKey: process.env.API_KEY});
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
      Transformation Command: ${cameraPrompt}
      ${creativeDirective}
      
      TECHNICAL CONSTRAINTS:
      1. GEOMETRY: Preserve primary subject identity.
      2. PERSPECTIVE: Recalculate vanishing points for new orientation.
      3. LIGHTING: Ensure shadows align with spatial coordinates.
      4. SEED: ${settings.seed}
      
      OUTPUT: High-resolution cinematic result.`
    };

    const config: any = {
      imageConfig: {
        aspectRatio: "1:1",
      }
    };

    // Support for higher resolutions if Pro model is selected
    if (settings.quality === 'pro' && settings.imageSize) {
      config.imageConfig.imageSize = settings.imageSize;
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [imagePart, textPart] },
      config
    });

    let imageUrl = '';
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      // Rule: Iterate through all parts to find the image part, do not assume it is the first part.
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          console.debug("Model response text part:", part.text);
        }
      }
    }

    if (!imageUrl) throw new Error("CRITICAL_FAULT: Visual buffer reconstruction failed.");
    return imageUrl;
  }
}

export const geminiService = new GeminiService();
