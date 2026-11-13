export type WeatherConditionType =
  | "Sunny"
  | "Rainy"
  | "Snowy"
  | "Overcast"
  | "Thunderstorm"
  | "Foggy"
  | "Windy";

export interface WeatherData {
  temp: number;
  apparentTemp?: number;
  condition: string;
  conditionType: WeatherConditionType;
  humidity: number;
  wind: string;
  windSpeed: number; // km/h
  uvIndex: number;
  aqi: number;
  aqiLabel: string;
  pressure: number; // hPa
  updatedAt?: string;
}

export interface ForecastDay {
  dayName: string;
  date?: string;
  tempMin: number;
  tempMax: number;
  condition: string;
  conditionType: WeatherConditionType;
  precipitation: number; // %
}

export interface LandmarkInfo {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  history: string;
  photoTips: string[];
  bestTime: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  admin1?: string;
  englishName: string;
  introduction: string;
  landmarks: LandmarkInfo[];
  landmarkSvgId?: string;
}

export interface ItineraryActivity {
  time: string;
  title: string;
  description: string;
  location: string;
  costEstimate: string;
  landmarkConnection: boolean;
}

export interface ItineraryDay {
  dayNumber: number;
  theme: string;
  activities: ItineraryActivity[];
}

export interface NearbyRecommendation {
  name: string;
  category: string;
  reason: string;
  distance: string;
}

export interface TravelItinerary {
  city: string;
  summary: string;
  days: ItineraryDay[];
  nearbyRecommendations: NearbyRecommendation[];
  isDemo?: boolean;
  errorMessage?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface WeatherPushAlert {
  id: string;
  city: string;
  title: string;
  message: string;
  type: "warning" | "info" | "success";
  time: string;
}
