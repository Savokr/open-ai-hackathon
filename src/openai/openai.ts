import { Configuration, OpenAIApi } from 'openai';

import { config } from '../../config';

interface ImageGenerationResponse {
    text: string;
    imageUrl?: string;
    b64_json?: string;
}

export class OpenApi {
    private openai: OpenAIApi;

    constructor(apiKey?: string) {
        if (!apiKey) {
            apiKey = config.openAiApi;
        }

        const configuration = new Configuration({
            apiKey,
        });
        this.openai = new OpenAIApi(configuration);
    }

    async getImagesFromText(
        initialPrompt: string,
        n = 10,
    ): Promise<ImageGenerationResponse[]> {
        const textResponse = await this.openai.createCompletion({
            model: 'text-davinci-001',
            prompt: initialPrompt,
            temperature: 0.4,
            max_tokens: Math.floor(2048 / n),
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            n: n,
        });

        const result: ImageGenerationResponse[] = [];
        for (let i = 0; i < textResponse.data.choices.length; ++i) {
            const text =
                textResponse.data.choices[i].text?.replace('\n', '') ?? '';
            // const imageResponse = await this.openai.createImage({
            //     prompt: text,
            // });

            result.push({
                text,
                // imageUrl: imageResponse.data.data[0].url,
                // b64_json: imageResponse.data.data[0].b64_json,
            });
        }

        return result;
    }
}
