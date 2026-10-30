export type FilteringMode = 'hide' | 'blur' | 'replace-real';

export type SensitivityLevel = 'low' | 'medium' | 'high';

export interface UserSettings {
  enabled: boolean;
  mode: FilteringMode;
  sensitivity: SensitivityLevel;
  filterClothingModels: boolean;
  filterFoodImagery: boolean;
  filterMarketingSlop: boolean;
  prioritizeCustomerPhotos: boolean;
  highlightRealPhotos: boolean;
  whitelistedBrands: string[];
}

export interface InspectionStats {
  listingsScanned: number;
  aiImagesFiltered: number;
  realPhotosSwapped: number;
  lastUpdated: number;
}

export interface AIDetectionResult {
  isAI: boolean;
  confidence: number; // 0 to 1
  reasons: string[];
  visualSignals: {
    unnaturalSmoothness?: boolean;
    frequencyAnomaly?: boolean;
    extremeSaturation?: boolean;
  };
  metadataSignals: {
    suspiciousBrand?: boolean;
    aiBuzzwordsFound?: string[];
    aiModelIndicator?: boolean;
  };
}

export interface RealCustomerPhoto {
  url: string;
  thumbnailUrl?: string;
  reviewerName?: string;
  reviewTitle?: string;
  verifiedPurchase?: boolean;
}

export interface ExtensionMessage {
  type: 'GET_SETTINGS' | 'SET_SETTINGS' | 'GET_STATS' | 'INCREMENT_STAT' | 'UPDATE_BADGE';
  payload?: any;
}
