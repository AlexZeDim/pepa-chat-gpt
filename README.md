<p align="center">
  <img src="https://i.imgur.com/OZqzhli.png" width="200" alt="CMNW Logo" />
</p>


## Pepa Chat-GPT3 

Pepa is a discord chatbot, which uses OpenAI ChatGPT-3 model as an engine for text communications, some of its features are bound to the exact guild server for which he was developed. But his main feature is to communicate via text message is free-to-use.

Based on [**OpenAI ChatGPT-3**](https://openai.com/blog/chatgpt/). Designed for [**Monk's Temple of Five Dawns**](https://discord.com/invite/fYSNb5U). Operated by CMNW.

## Permissions

Pepa needs `message content` permission & ability to view & send message in text-channels, where you want him to present.

## Contributions & Issues policy.

If you'd like something to merge with, or any other questions, please contact AlexZeDim#2645 via Discord directly. Have you found a bug? Feel free to make an issue about it [here](https://github.com/AlexZeDim/pepa-chatGPT/issues).

## Deployment

1. Clone the repository with `git clone` or download the code.
2. Create a `.env` file with the following content:

```
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
GITHUB_TOKEN=
OPENAI_API_KEY_1=
OPENAI_API_KEY_2=
DISCORD_TOKEN=
```
3. Install all dependencies `npm install` or `yarn`.
4. Build & run via `nest start`
