import { GoogleGenAI, Type } from "@google/genai";
import type { TripPreferences, Itinerary, GroundingChunk } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getPrompt = (preferences: TripPreferences): string => {
  return `
Eres una IA experta en planificación de viajes. Tu tarea es crear un itinerario de viaje personalizado, detallado y realista basado en las preferencias del usuario.

**Preferencias del Usuario:**
- Destino: ${preferences.destination}
- Duración: ${preferences.duration} días
- Presupuesto: Aproximadamente ${preferences.budget}
- Intereses Clave: ${preferences.interests.join(', ')}
- Restricciones/Requisitos Específicos: ${preferences.restrictions || 'Ninguno'}

**Instrucciones:**
1.  **Genera un Itinerario Día por Día:** Crea un plan para cada día del viaje.
2.  **Sé Realista:** El horario debe ser factible. Considera el tiempo de viaje entre ubicaciones, los horarios de apertura y un ritmo realista. No sugieras lugares que estarían cerrados.
3.  **Respeta el Presupuesto:** Sugiere actividades y opciones gastronómicas que se ajusten al presupuesto proporcionado. Proporciona costos estimados para las actividades siempre que sea posible.
4.  **Alinea con los Intereses:** Las actividades deben reflejar los intereses clave del usuario.
5.  **Proporciona una Justificación:** Después del itinerario, incluye una sección que explique cómo el plan se adapta a las preferencias, el presupuesto y las restricciones del usuario.
6.  **Simula RAG/Ajuste Fino (Fine-Tuning):** Actúa como si tuvieras acceso a las guías de viaje más actuales, reseñas de usuarios e información local (como horarios de apertura y precios de entradas). Tus descripciones deben ser atractivas e informativas, como un blog de viajes de alta calidad.
7.  **Datos de Ubicación:** Para cada lugar/actividad sugerida, proporciona su nombre y latitud y longitud aproximadas.

**Formato de Salida:**
Responde ÚNICAMENTE con un solo objeto JSON válido. No incluyas texto, bloques de código (como \`\`\`json), ni explicaciones antes o después del objeto JSON. El objeto JSON debe cumplir con el esquema especificado.
`;
};

export const generateItinerary = async (preferences: TripPreferences): Promise<Itinerary> => {
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: getPrompt(preferences),
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
    throw new Error("Error al generar el itinerario. Es posible que el modelo haya devuelto un formato no válido.");
  }
};

export const getLocationInfo = async (locationName: string, destination: string, userCoords: {lat: number, lon: number} | null): Promise<{text: string; chunks: GroundingChunk[]}> => {
    try {
        const prompt = `Proporciona información actualizada para un viajero sobre "${locationName}" en ${destination}. Incluye detalles como horarios de apertura, reseñas típicas de visitantes y cualquier noticia o consejo reciente.`;
        
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
        throw new Error("Error al obtener información de la ubicación con grounding.");
    }
};