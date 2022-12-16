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
            organization: 'org-OBa3B621reUXWiVYyxWuPhNp',
            apiKey,
        });
        this.openai = new OpenAIApi(configuration);
        this.openai.listModels().then((ar) => console.log(ar.data));
    }

    
    async getImagesFromTopic(
        initialPrompt: string,
        n = 1,
    ): Promise<ImageGenerationResponse[]> {
        const { openai } = this;
        let phrases: string [] = []
        const textResponse = await textRequest(initialPrompt);
        // await openai.createCompletion({
        //     model: 'text-curie-001',
        //     prompt: initialPrompt,
        // });
        console.log(textResponse);
        phrases = textResponse.choices[0].text.split('\n')
        // phrases = phrases.filter(s => s.length !== 0).map((s) => {
        //     return s.slice(5)
        // });
        console.log(phrases);

        const result: ImageGenerationResponse[] = [];
        for (let i = 0; i < phrases.length; ++i) {
            const text =
                phrases[0] ?? '';
            const imageResponse = await this.openai.createImage({
                prompt: text,
            });

            result.push({
                text,
                imageUrl: imageResponse.data.data[0].url,
                // b64_json: imageResponse.data.data[0].b64_json,
            });
        }

        return result;
    }
}

function textRequest(prompt: string) {
    const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + String(config.openAiApi)
        },
        body: JSON.stringify({
          'prompt': prompt,
          'max_tokens': 1000,
          'stop': ["\"\"\""],
        })
      };
      return fetch('https://api.openai.com/v1/engines/text-curie-001/completions', requestOptions)
          .then(response => response.json())
}

function imageRequest(prompt: string) {
    const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + String(config.openAiApi)
        },
        body: JSON.stringify({
          'prompt': prompt,
          'max_tokens': 1000,
          'stop': ["\"\"\""],
        })
      };
      return fetch('https://api.openai.com/v1/engines/text-curie-001/completions', requestOptions)
          .then(response => response.json())
}