import requests

invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"

headers = {
  "Authorization": "Bearer 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",
  "Accept": "application/json"
}

payload = {
  "model": "google/gemma-4-31b-it",
  "messages": [{"role":"user","content":"Hello!"}],
  "max_tokens": 100,
}

response = requests.post(invoke_url, headers=headers, json=payload)
print("Status Code:", response.status_code)
print("Response:", response.text)
