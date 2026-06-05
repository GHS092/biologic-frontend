import os

file_path = r'c:\Users\PC\Downloads\proyecto-medico-ia\src\App.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I will use a simple replace for msg.content
old_str = "msg.content.replace(/\\\\n/g, '\\n').replace(/<br\\s*\\/?>/gi, '\\n\\n').replace(/\\s* \\s*/g, '\\n\\n')"
new_str = "healText(msg.content).replace(/\\\\n/g, '\\n').replace(/<br\\s*\\/?>/gi, '\\n\\n').replace(/\\s* \\s*/g, '\\n\\n')"
content = content.replace(old_str, new_str)

old_str2 = "analysis.summary.replace(/\\\\n/g, '\\n').replace(/<br\\s*\\/?>/gi, '\\n\\n').replace(/\\s* \\s*/g, '\\n\\n')"
new_str2 = "healText(analysis.summary).replace(/\\\\n/g, '\\n').replace(/<br\\s*\\/?>/gi, '\\n\\n').replace(/\\s* \\s*/g, '\\n\\n')"
content = content.replace(old_str2, new_str2)

old_str3 = "evalItem.critique.replace(/\\\\n/g, '\\n').replace(/<br\\s*\\/?>/gi, '\\n\\n').replace(/\\s* \\s*/g, '\\n\\n')"
new_str3 = "healText(evalItem.critique).replace(/\\\\n/g, '\\n').replace(/<br\\s*\\/?>/gi, '\\n\\n').replace(/\\s* \\s*/g, '\\n\\n')"
content = content.replace(old_str3, new_str3)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Final patch applied!')
