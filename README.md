# Project Infinite Gallery



Walk through art gallery of your own choice and flavor with paintings on arbitrary topic (within the guidelines of OpenAI GPT-3 and DALLE 2 models 🌝).

## Demo
You can test the demo here by creating a temporary API token. It will create 12 `512x512` image generations with DALLE model and around 300-600 tokens of `text-davinci-003` model per one run. The token is only stored on client side, you can check the sources for proof.

## Running locally
To run locally first set your OpenAI API key in `config.ts` file, see `config.example.ts` for reference. Then run the following commands
```
yarn
yarn serve
```
and enjoy your own gallery.

## Future features
* Download created pieces
* Really infinite corrdior that updates as you move
* A few other cool ideas