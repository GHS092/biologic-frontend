import requests

invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
headers = {
  "Authorization": "Bearer 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",
  "Accept": "application/json"
}

def test_nim(model_name, kwargs={}):
    payload = {
      "model": model_name,
      "messages": [{"role":"user","content":"Hello"}],
      "max_tokens": 1024,
    }
    payload.update(kwargs)
    print(f"Testing {model_name} with {kwargs}")
    try:
        response = requests.post(invoke_url, headers=headers, json=payload, timeout=10)
        print("Status:", response.status_code)
        if response.status_code != 200:
             print("Error:", response.text[:200])
        else:
             print("Success!")
    except Exception as e:
        print("Exception:", str(e))

test_nim("google/gemma-4-31b-it")
test_nim("google/gemma-2-27b-it")
test_nim("google/gemma-4-31b-it", {"chat_template_kwargs": {"enable_thinking": True}})
