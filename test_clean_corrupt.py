import sys
sys.path.append(r'c:\Users\PC\Downloads\proyecto-medico-ia\biologic-backend-modal')
from api_utils.gemini_core import clean_json, heal_tokenization

text = '{"test1": "La opacificaci\ufffdn", "test2": "Hemot\ufffdrax", "test3": "Una neumon\ufffda"}'
print("Original:", text)
print("Cleaned:", clean_json(text))
