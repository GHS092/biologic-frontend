import requests

invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"

headers = {
  "Authorization": "Bearer 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",
  "Accept": "application/json"
}

# 1x1 white pixel base64
img_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="

payload = {
  "model": "google/gemma-4-31b-it",
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "What is in this image?"},
        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}}
      ]
    }
  ],
  "max_tokens": 100,
}

print("Sending request...")
try:
    response = requests.post(invoke_url, headers=headers, json=payload, timeout=10)
    print("Status Code:", response.status_code)
    print("Response:", response.text)
except Exception as e:
    print("Error:", str(e))
