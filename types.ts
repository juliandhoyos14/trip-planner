
export interface TripPreferences {
  destination: string;
  duration: number;
  budget: string;
  interests: string[];
  restrictions: string;
}

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

export interface Activity {
  time: string;
  description: string;
  estimatedCost: string;
  location: Location;
}

export interface DayPlan {
  day: number;
  title: string;
  activities: Activity[];
}

export interface Justification {
  interestsAlignment: string;
  budgetAlignment: string;
  restrictionsAlignment: string;
}

export interface Itinerary {
  itinerary: DayPlan[];
  justification: Justification;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
      reviewSnippets: {
        uri: string;
        text: string;
      }[];
    }[];
  };
}
