import { Configuration, OpenAIApi, ImagesResponseDataInner, ImagesResponse } from 'openai';

import { image1 } from './testImages';

//@ts-ignore
import { config } from 'config';

interface ImageGenerationResponse {
    text: string;
    imageData: Promise<ImagesResponseDataInner>
}

type ConfigType = {
    config: {
        openAiApi: string
    }
}

export class OpenApi {
    private apiKey: string = '';

    constructor(apiKey?: string) {
        if (!apiKey) {
            this.apiKey = config?.openAiApi ?? '';
        }
    }

    setApiKey(key: string) {
        this.apiKey = key;
    }

    async getImagesFromTopic(
        initialPrompt: string,
        n = 1,
    ): Promise<ImageGenerationResponse[]> {
        const textResponse = await this.textRequest(initialPrompt, n);

        const phrases = textResponse.choices.map((ch: { text: string }) =>
            ch.text.replace(/(\n)/g, '').replace(/\./g, ''));

        const result: ImageGenerationResponse[] = [];
        for (let i = 0; i < phrases.length; ++i) {
            const imagePrompt = phrases[i];
            const imageResponse = this.imageRequest(imagePrompt + ' oil painting');

            result.push({
                text: imagePrompt,
                imageData: imageResponse.then((resp: ImagesResponse) => {
                    return resp.data[0];
                })
            });
        }

        return result;
    }


    async textRequest(prompt: string, variantsNumber: number = 1) {
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + String(this.apiKey)
            },
            body: JSON.stringify({
                'prompt': prompt,
                'max_tokens': 100,
                'n': variantsNumber,
                'stop': ["\"\"\""],
            })
        };
        return fetch('https://api.openai.com/v1/engines/text-davinci-003/completions', requestOptions)
            .then(response => response.json())
    }

    async imageRequest(prompt: string) {
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + String(this.apiKey)
            },
            body: JSON.stringify({
                'prompt': prompt,
                'size': '512x512',
                'n': 1,
                'response_format': 'b64_json'
            })
        };
        return fetch('https://api.openai.com/v1/images/generations', requestOptions)
            .then(response => response.json())
    }

    async mockImageRequest(promt: string = 'catOrTree') {
        const result: ImagesResponse = {
            data: [{
                b64_json: image1,
                //url: 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-OBa3B621reUXWiVYyxWuPhNp/user-6APxhygrRT706ltkzrks38Ft/img-BFgXZcUV3Bog63k7QoLp8nX1.png?st=2022-12-17T14%3A33%3A13Z&se=2022-12-17T16%3A33%3A13Z&sp=r&sv=2021-08-06&sr=b&rscd=inline&rsct=image/png&skoid=6aaadede-4fb3-4698-a8f6-684d7786b067&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2022-12-17T15%3A33%3A13Z&ske=2022-12-18T15%3A33%3A13Z&sks=b&skv=2021-08-06&sig=n9eZdGQyCH6cEP3uzzym0jTsV5azwBtFBiucWCKDW7o%3D'
            }],
            created: -1
        };

        await asyncTimeout(Math.random() * 1000);

        return result;
    }
}

async function asyncTimeout(time: number) {
    return new Promise(function (resolve, reject) {
        setTimeout(resolve, time);
    });
}


// Cat picture https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/RedCat_8727.jpg/1200px-RedCat_8727.jpg