import os

file_path = r'c:\Users\PC\Downloads\proyecto-medico-ia\src\App.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const [isDebateMode, setIsDebateMode] = useState(false);", "const [isDebateMode, setIsDebateMode] = useState(true);")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Red Team default state patched!')
