export interface ClassificationResult {
  type: string;
  species: string;
  description: string;
  isFruitOrVeg: boolean;
  /**
   * Ripeness and confidence are always provided by the Gemini classification
   * endpoint, so we expose them as required fields instead of optional values.
   */
  ripeness: string;
  confidence: number;
}

/**
 * Represents the ripeness analysis that augments a plant classification result.
 */
export interface RipenessResult {
  ripeness: string;
  confidence: number;
}

export type GardenArea = 'horta' | 'pomar';

export interface Plant {
  id: string;
  name: string;
  image_url?: string | null;
  watering_freq: number;
  last_watered?: string | null;
  created_at?: string;
  type?: GardenArea;
}
