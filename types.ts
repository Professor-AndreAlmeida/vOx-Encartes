
export interface ExtractedProduct {
  id: string;
  originalCrop: string; // Base64
  processedImage: string | null; // Base64
  name: string;
  price: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  editHistory: string[]; // Prompts used
}

export interface LeafletState {
  originalImage: string | null; // Base64
  products: ExtractedProduct[];
  isAnalyzing: boolean;
}

export interface UserSettings {
  name: string;
  apiKey: string;
  preferredModel?: string; // New field for model selection
  createdAt: number;
}
