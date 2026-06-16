import asyncio
import httpx

async def test():
    async with httpx.AsyncClient() as client:
        res = await client.post('https://integrate.api.nvidia.com/v1/chat/completions', headers={'Authorization': 'Bearer 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', 'Accept': 'application/json', 'Content-Type': 'application/json'}, json={'model': 'meta/llama-3.1-70b-instruct', 'messages': [{'role':'user', 'content':'hi'}], 'max_tokens': 4096})
        print('Status:', res.status_code)
        print('Body:', repr(res.text))

asyncio.run(test())
