
import { GoogleGenAI, Type } from "@google/genai";
import type { TripPreferences, Itinerary, GroundingChunk, Language } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getPrompt = (preferences: TripPreferences, language: Language): string => {
  const langInstruction = language === 'es' ? 'Spanish' : 'English';
  return `
You are an expert travel planning AI. Your task is to create a personalized, detailed, and realistic travel itinerary based on user preferences.

**Output Language:** Generate the entire response, including all descriptions, titles, and justifications, in ${langInstruction}.

**User Preferences:**
- Destination: ${preferences.destination}
- Duration: ${preferences.duration} days
- Budget: Approximately ${preferences.budget}
- Key Interests: ${preferences.interests.join(', ')}
- Specific Restrictions/Requirements: ${preferences.restrictions || 'None'}

**Instructions:**
1.  **Generate a Day-by-Day Itinerary:** Create a plan for each day of the trip.
2.  **Be Realistic:** The schedule must be feasible. Consider travel time between locations, opening hours, and a realistic pace. Do not suggest places that would be closed.
3.  **Respect the Budget:** Suggest activities and dining options that align with the provided budget. Provide estimated costs for activities where possible.
4.  **Align with Interests:** The activities should reflect the user's key interests.
5.  **Provide a Justification:** After the itinerary, include a section explaining how the plan accommodates the user's preferences, budget, and restrictions.
6.  **Simulate RAG/Fine-Tuning:** Act as if you have access to the most current travel guides, user reviews, and local information (like opening hours and ticket prices). Your descriptions should be engaging and informative, like a high-quality travel blog.
7.  **Location Data:** For each suggested place/activity, provide its name and approximate latitude and longitude.

**Output Format:**
Respond ONLY with a single, valid JSON object. Do not include any text, code blocks (like \`\`\`json), or explanations before or after the JSON object. The JSON object must adhere to the specified schema.
`;
};

export const generateItinerary = async (preferences: TripPreferences, language: Language): Promise<Itinerary> => {
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: getPrompt(preferences, language),
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    itinerary: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                day: { type: Type.INTEGER },
                                title: { type: Type.STRING },
                                activities: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            time: { type: Type.STRING },
                                            description: { type: Type.STRING },
                                            estimatedCost: { type: Type.STRING },
                                            location: {
                                                type: Type.OBJECT,
                                                properties: {
                                                    name: { type: Type.STRING },
                                                    latitude: { type: Type.NUMBER },
                                                    longitude: { type: Type.NUMBER },
                                                },
                                                required: ["name", "latitude", "longitude"],
                                            },
                                        },
                                        required: ["time", "description", "estimatedCost", "location"],
                                    },
                                },
                            },
                            required: ["day", "title", "activities"],
                        },
                    },
                    justification: {
                        type: Type.OBJECT,
                        properties: {
                            interestsAlignment: { type: Type.STRING },
                            budgetAlignment: { type: Type.STRING },
                            restrictionsAlignment: { type: Type.STRING },
                        },
                        required: ["interestsAlignment", "budgetAlignment", "restrictionsAlignment"],
                    },
                },
                required: ["itinerary", "justification"],
            },
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as Itinerary;
  } catch (error) {
    console.error("Error generating itinerary:", error);
    throw new Error("Error generating itinerary. The model may have returned an invalid format.");
  }
};

export const getLocationInfo = async (locationName: string, destination: string, userCoords: {lat: number, lon: number} | null, language: Language): Promise<{text: string; chunks: GroundingChunk[]}> => {
    try {
        const langInstruction = language === 'es' ? 'Spanish' : 'English';
        const prompt = `Provide up-to-date information for a traveler about "${locationName}" in ${destination}. Include details like opening hours, typical visitor reviews, and any recent news or tips. Respond entirely in ${langInstruction}.`;
        
        const config: any = {
            tools: [{ googleSearch: {} }, { googleMaps: {} }],
        };

        if (userCoords) {
            config.toolConfig = {
                retrievalConfig: {
                    latLng: {
                        latitude: userCoords.lat,
                        longitude: userCoords.lon
                    }
                }
            };
        }
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: config,
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        return {
            text: response.text,
            chunks: groundingChunks as GroundingChunk[]
        };

    } catch(error) {
        console.error("Error getting location info:", error);
        throw new Error("Error getting location info with grounding.");
    }
};