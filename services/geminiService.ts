
import { GoogleGenAI, Type } from "@google/genai";
import { Department, User, CivicReport } from "../types";

// Initialize AI with the specific model and tools for Maps Grounding
// Using the recommended pattern for API key access
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Analyze a text report and categorize it
export const analyzeReport = async (description: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this municipal issue report and categorize it into one of: ${Object.values(Department).join(', ')}. Return only the category name. Description: ${description}`,
  });
  
  const category = response.text?.trim() as Department;
  return Object.values(Department).includes(category) ? category : Department.ROADS;
};

// Use Vision AI to analyze an image of a civic issue
export const analyzeImageSignal = async (base64Image: string, mimeType: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          { text: `Analyze this image of a municipal/civic issue. 
            1. Identify the specific issue.
            2. Suggest a concise, professional title.
            3. Provide a brief 2-sentence description of what's happening.
            4. Classify it into exactly one of these categories: ${Object.values(Department).join(', ')}.
            5. Provide a specific 'issueType' (e.g., 'Pothole', 'Fallen Tree', 'Graffiti', 'Overflowing Bin').
            
            Return the result in JSON format with keys: title, description, category, issueType.` },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            issueType: { type: Type.STRING },
          },
          required: ["title", "description", "category", "issueType"],
          propertyOrdering: ["title", "description", "category", "issueType"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Vision Analysis Error:", error);
    return null;
  }
};

// Audio transcription using the specific native audio model for best accuracy
export const transcribeAudio = async (base64Audio: string, mimeType: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Audio,
              mimeType: mimeType,
            },
          },
          { text: "Transcribe the following audio precisely. If the speaker uses a language other than English, transcribe it in that language. Output ONLY the transcription text without any commentary or markers." },
        ],
      },
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Failed to transcribe audio signal.");
  }
};

export interface ChatContext {
  user: User;
  reports: CivicReport[];
}

// Chatbot response with contextual knowledge and Maps Grounding
export const getChatbotResponse = async (message: string, context: ChatContext, lat?: number, lng?: number) => {
  const { user, reports } = context;
  
  const userReportsSummary = reports
    .filter(r => r.reporterId === user.id)
    .map(r => `- ${r.title} (Status: ${r.status}, Category: ${r.category}, ID: ${r.id.slice(-6)})`)
    .join('\n');

  const systemPrompt = `You are 'Civic Buddy', the personalized AI assistant for the Civic Samadhan platform. 
You are currently helping ${user.name} (Level ${user.level} Citizen, Points: ${user.points}).

USER PROFILE DATA:
- Name: ${user.name}
- Level: ${user.level}
- Total Points: ${user.points}
- City Rank: #${user.cityRank}
- Badges Earned: ${user.earnedBadgeIds.length}

USER'S SUBMITTED REPORTS:
${userReportsSummary || 'No reports submitted yet.'}

INSTRUCTIONS:
1. When the user asks about "my reports", reference the specific reports listed above.
2. If they ask about nearby facilities, use the googleMaps tool.
3. Keep responses concise, high-tech, and efficient.
4. If you use Google Maps, you MUST list the URLs found in grounding metadata.`;

  const config: any = {
    systemInstruction: systemPrompt,
    tools: [{ googleMaps: {} }],
  };

  if (lat !== undefined && lng !== undefined) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: { latitude: lat, longitude: lng }
      }
    };
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: message,
    config: config,
  });

  const text = response.text;
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

  return { text, groundingChunks };
};

// Reverse geocoding and landmark detection using Google Maps grounding
export const getLocationContext = async (lat: number, lng: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Provide the precise street address, neighborhood, and the nearest major municipal landmark for these coordinates. Be as specific as possible.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      },
    });
    return response.text;
  } catch (error) {
    return `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};
