import sys
sys.path.append(r'c:\Users\PC\Downloads\proyecto-medico-ia\biologic-backend-modal')
from api_utils.gemini_core import clean_json, heal_tokenization

text = '{"test1": "La opacificación y el tamaño son importantes.", "test2": "Hemotórax", "test3": "Una neumonía"}'
print("Original:", text)
print("Cleaned:", clean_json(text))
