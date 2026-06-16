import urllib.request
import json

url = "https://gem-frontend-production.up.railway.app/chat"
data = {"messages": [{"role": "user", "content": "hello"}]}
req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.status}")
        print(f"Body: {response.read().decode('utf-8')}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(f"Error Body: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Exception: {type(e).__name__}: {str(e)}")
