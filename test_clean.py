import re
text = """Here is text
```json
{
  "a": 1
}
```"""
match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
if match:
    print(repr(match.group(1)))
else:
    print("No match")
