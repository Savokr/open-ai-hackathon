import { ImagesResponseDataInner, ImagesResponse } from 'openai';
interface ImageGenerationResponse {
    text: string;
    imageData: Promise<ImagesResponseDataInner>;
}
export declare class OpenApi {
    private apiKey;
    constructor(apiKey?: string);
    setApiKey(key: string): void;
    getImagesFromTopic(initialPrompt: string, n?: number): Promise<ImageGenerationResponse[]>;
    textRequest(prompt: string, variantsNumber?: number): Promise<any>;
    imageRequest(prompt: string): Promise<any>;
    mockImageRequest(promt?: string): Promise<ImagesResponse>;
}
export {};
