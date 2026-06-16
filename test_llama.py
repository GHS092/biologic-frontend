import requests

res = requests.post(
    'https://integrate.api.nvidia.com/v1/chat/completions',
    headers={
        'Authorization': 'Bearer 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',
        'Accept': 'application/json'
    },
    json={
        'model': 'meta/llama-3.1-70b-instruct',
        'messages': [{'role':'user', 'content':'Devuelve esto en JSON estricto: {"a": 1}'}],
        'max_tokens': 100
    },
    timeout=10
)

print(repr(res.json()['choices'][0]['message']['content']))
