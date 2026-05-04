import { BytedanceTtsProvider } from "./bytedance-tts";
import { mockImageProvider } from "./image-mock";
import { JimengImageProvider } from "./jimeng-image";
import { mockTtsProvider } from "./tts-mock";
import { ImageProvider, TtsProvider } from "./types";

export function getImageProvider(): ImageProvider {
  const ak = process.env.VOLC_ACCESS_KEY_ID;
  const sk = process.env.VOLC_SECRET_ACCESS_KEY;
  if (ak && sk && process.env.IMAGE_PROVIDER !== "mock") {
    return new JimengImageProvider({ ak, sk });
  }
  return mockImageProvider;
}

export function getTtsProvider(): TtsProvider {
  const appid = process.env.BYTEDANCE_TTS_APPID;
  const token = process.env.BYTEDANCE_TTS_TOKEN;
  if (appid && token && process.env.TTS_PROVIDER !== "mock") {
    return new BytedanceTtsProvider({ appid, accessToken: token });
  }
  return mockTtsProvider;
}

export function describeProviders(): { image: string; tts: string } {
  return {
    image: getImageProvider().name,
    tts: getTtsProvider().name
  };
}

export type { ImageProvider, TtsProvider } from "./types";
