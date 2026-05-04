export interface ImageGenInput {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  seed?: number;
  styleHint?: string;
  referenceUrl?: string;
}

export interface ImageGenResult {
  url: string;
  localPath: string;
  provider: string;
  promptUsed: string;
  cost?: number;
}

export interface ImageProvider {
  name: string;
  generate(input: ImageGenInput, outDir: string, fileBase: string): Promise<ImageGenResult>;
}

export interface TtsInput {
  text: string;
  voice?: string;
  speed?: number;
  emotion?: string;
}

export interface TtsResult {
  url: string;
  localPath: string;
  durationMs: number;
  provider: string;
  cost?: number;
}

export interface TtsProvider {
  name: string;
  synthesize(input: TtsInput, outDir: string, fileBase: string): Promise<TtsResult>;
}
