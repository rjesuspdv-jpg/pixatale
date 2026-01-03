
import { GoogleGenAI, Type } from "@google/genai";
import { StoryBook, Language, StoryPage } from "../types";

// Always use process.env.API_KEY directly as per guidelines
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStoryContent = async (
  topic: string, 
  language: Language, 
  heroName?: string, 
  heroGender?: string,
  heroHair?: string,
  heroEyes?: string,
  heroClothing?: string
): Promise<StoryBook> => {
  const ai = getAI();
  
  let languageInstruction = `Language: ${language}.`;
  if (language === Language.BILINGUAL) {
    languageInstruction = `Language: Bilingual. Write every page in BOTH English and Spanish. 
    Structure each page content as:
    [English Paragraph]
    
    [Spanish Paragraph]
    Ensure strictly that there is a double line break (blank line) separating the English text and the Spanish translation.`;
  }

  // Construct detailed character context
  let characterContext = "The main protagonist is determined by the story topic.";
  if (heroName || heroGender || heroHair || heroEyes || heroClothing) {
    const genderStr = heroGender || "child";
    const nameStr = heroName ? `named ${heroName}` : "";
    const hairStr = heroHair ? `with ${heroHair} hair` : "";
    const eyesStr = heroEyes ? `with ${heroEyes} eyes` : "";
    const clothStr = heroClothing ? `wearing ${heroClothing}` : "";
    
    characterContext = `IMPORTANT PERSONALIZATION: The main protagonist MUST be a ${genderStr} ${nameStr}, ${hairStr}, ${eyesStr}, ${clothStr}. 
    Use the name "${heroName || 'Hero'}" in the text.
    
    CRITICAL VISUAL CONSISTENCY: Every single image prompt MUST describe the character exactly like this: "A ${genderStr} with ${heroHair || 'distinct'} hair and ${heroClothing || 'distinct clothes'}".`;
  }

  // Use gemini-3-flash-preview for general text tasks
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a charming 10-page children's adventure story about: "${topic}". 
    The tone should be engaging and adventurous. 
    ${languageInstruction}
    ${characterContext}
    Each page should have roughly 2 sentences per language (Keep it short to fit the page).
    
    CRITICAL INSTRUCTIONS FOR IMAGE COMPOSITION & LAYOUT:
    1. First, create a "Visual Character Profile" based on the personalization details provided above. Use this consistent look for every image.
    2. **COVER IMAGE**: Create a specific prompt for the book cover. Iconic, centered, heroic.
    3. **PAGE LAYOUT LOGIC (MANDATORY)**: You MUST vary the "textPosition" (top/bottom) and DESIGN the "imagePrompt" to leave EMPTY SPACE for that text.
       
       - CASE A: If you choose 'textPosition': 'bottom':
         The 'imagePrompt' MUST end with: "...subject centered in the UPPER 70% of the frame, leave EMPTY DARK SPACE or simple ground at the BOTTOM 30% for text, wide shot."
       
       - CASE B: If you choose 'textPosition': 'top':
         The 'imagePrompt' MUST end with: "...subject centered in the LOWER 70% of the frame, leave EMPTY SKY or simple ceiling at the TOP 30% for text, wide shot."

    4. For EVERY 'imagePrompt', start with the character profile.
    5. Append "no text, no speech bubbles, vertical composition, cinematic shot, 16-bit pixel art style" to every image prompt.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          coverImagePrompt: { type: Type.STRING, description: "Iconic visual description for the book cover." },
          pages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                pageNumber: { type: Type.INTEGER },
                content: { type: Type.STRING },
                imagePrompt: { type: Type.STRING, description: "Visual description enforcing negative space for text." },
                textPosition: { type: Type.STRING, enum: ["top", "bottom"], description: "Position of text. MUST match the negative space in the image." }
              },
              required: ["pageNumber", "content", "imagePrompt", "textPosition"]
            }
          }
        },
        required: ["title", "coverImagePrompt", "pages"]
      }
    }
  });

  if (!response.text) throw new Error("No story content received");
  return JSON.parse(response.text.trim()) as StoryBook;
};

export const generatePixelArt = async (prompt: string): Promise<string> => {
  const ai = getAI();
  // Updated prompt for Pixel Art style with strict Negative Prompting for text
  const fullPrompt = `16-bit pixel art style, retro rpg aesthetic, vibrant colors, detailed, high resolution, masterpiece, fantasy adventure style. 
  Scene description: ${prompt}. 
  IMPORTANT: NO text, NO speech bubbles, NO words, NO interface, NO hud, pure illustration.`;
  
  // Retry mechanism for image generation
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Use gemini-2.5-flash-image for image generation tasks
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: fullPrompt }] },
        config: {
          imageConfig: {
            aspectRatio: "3:4"
          }
        }
      });

      // Iterate through parts to find the image data as recommended
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      
      console.warn(`Attempt ${attempt + 1}: No image data in response for prompt: ${prompt}`);
    } catch (error: any) {
      console.warn(`Attempt ${attempt + 1} failed`, error);
      
      // If it's a quota error (429), throw immediately to let the main loop handle the delay or stop
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
         throw error;
      }
      lastError = error;
    }

    // Wait before retrying internal errors
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
    }
  }

  throw lastError || new Error("No image data received after multiple attempts");
};
