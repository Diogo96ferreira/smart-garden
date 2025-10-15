export interface ClassificationResult {
  type: string;
  species: string;
  description: string;
  isFruitOrVeg: boolean;
  // FIX: Made ripeness and confidence required to align with the Gemini API response schema, which always provides these fields.
  ripeness: string;
  confidence: number;
}

// FIX: Added missing RipenessResult interface to resolve the import error in services/roboflowService.ts.
export interface RipenessResult {
  ripeness: string;
  confidence: number;
}
