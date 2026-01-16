
import { GoogleGenAI } from "@google/genai";
import { ImageData, GenerationSettings } from "../types";
import { MODELS } from "../constants";

export class GeminiService {
  /**
   * Generates an edited image based on camera prompts.
   */
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

    const textPart = {
      text: `[SYSTEM_INSTRUCTION: ACT AS A MASTER CINEMATOGRAPHER AND OPTICAL ENGINEER]
      [TASK: PHOTOREALISTIC PERSPECTIVE TRANSFORMATION]
      
      Modification Request: ${cameraPrompt}
      
      Constraints:
      1. EXACT SUBJECT PRESERVATION: The object in the source image must remain 100% identical in geometry, materials, and internal detail.
      2. SPATIAL LOGIC: Re-calculate light, shadows, and perspective lines according to the new camera position.
      3. LEVITATION PHYSICS: If floating is specified, render the object exactly 50cm from the floor. Use high-fidelity ambient occlusion and a soft contact shadow on the ground to visually confirm height.
      4. OPTICAL QUALITY: Match the lens characteristic (wide-angle vs standard) and maintain consistent global illumination.
      5. DETERMINISM: Use seed ${settings.seed} to maintain temporal consistency with previous renders.
      
      Final output must be a seamless, high-end photographic render.`
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

    if (!imageUrl) throw new Error("Processing Error: Spatial Engine returned no visual data.");
    return imageUrl;
  }
}

export const geminiService = new GeminiService();
