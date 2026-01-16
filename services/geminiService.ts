
import { GoogleGenAI } from "@google/genai";
import { ImageData, GenerationSettings, CameraControlState } from "../types";
import { MODEL_NAME } from "../constants";

export class GeminiService {
  /**
   * Generates an edited image based on camera prompts.
   * Using Gemini 2.5 Flash Image which is optimized for direct image-to-image transformations.
   */
  async generateImage(
    sourceImage: ImageData,
    cameraPrompt: string,
    settings: GenerationSettings
  ): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    
    const imagePart = {
      inlineData: {
        mimeType: sourceImage.mimeType,
        data: sourceImage.base64.split(',')[1],
      },
    };

    const textPart = {
      text: `ACT AS A PROFESSIONAL CINEMATOGRAPHER.
Your task is to re-render the provided image from a NEW CAMERA ANGLE.

CAMERA INSTRUCTIONS:
${cameraPrompt}

TECHNICAL CONSTRAINTS:
1. Maintain 100% consistency of objects, colors, and lighting from the original image.
2. The transformation MUST reflect the exact rotation, tilt, and focal length change requested.
3. If wide-angle is requested, add peripheral context and characteristic lens distortion.
4. Output ONLY the resulting image.

Generation Seed: ${settings.seed}
Inference Steps: ${settings.steps}`
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: {
        temperature: 0.4, // Lower temperature for higher consistency
      }
    });

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      throw new Error("Perspective transformation failed. Please try a different angle.");
    }

    return imageUrl;
  }

  /**
   * Mock service for video generation as described in the context.
   */
  async generateTransitionVideo(startImage: string, endImage: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 3500));
    // Simulated path for the video result
    return "https://www.w3schools.com/html/mov_bbb.mp4"; 
  }
}

export const geminiService = new GeminiService();
