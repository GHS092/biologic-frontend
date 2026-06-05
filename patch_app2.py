import os
import re

file_path = r'c:\Users\PC\Downloads\proyecto-medico-ia\src\App.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace msg.content.replace(...) with healText(msg.content)
content = re.sub(r'msg\.content\.replace\(/\\\\n/g,\s*\'\\n\'\)\.replace\(/<br\\s\*\\\\/\?>/gi,\s*\'\\n\\n\'\)\.replace\(/\\s\*\s*\\s\*/g,\s*\'\\n\\n\'\)', 'healText(msg.content)', content)
content = re.sub(r'conn\.extractedInsight\.replace\(/\\\\n/g,\s*\'\\n\'\)\.replace\(/<br\\s\*\\\\/\?>/gi,\s*\'\\n\\n\'\)\.replace\(/\\s\*\s*\\s\*/g,\s*\'\\n\\n\'\)', 'healText(conn.extractedInsight)', content)
content = re.sub(r'conn\.applicationToCurrent\.replace\(/\\\\n/g,\s*\'\\n\'\)\.replace\(/<br\\s\*\\\\/\?>/gi,\s*\'\\n\\n\'\)\.replace\(/\\s\*\s*\\s\*/g,\s*\'\\n\\n\'\)', 'healText(conn.applicationToCurrent)', content)
content = re.sub(r'evalItem\.critique\.replace\(/\\\\n/g,\s*\'\\n\'\)\.replace\(/<br\\s\*\\\\/\?>/gi,\s*\'\\n\\n\'\)\.replace\(/\\s\*\s*\\s\*/g,\s*\'\\n\\n\'\)', 'healText(evalItem.critique)', content)
content = re.sub(r'analysis\.summary\.replace\(/\\\\n/g,\s*\'\\n\'\)\.replace\(/<br\\s\*\\\\/\?>/gi,\s*\'\\n\\n\'\)\.replace\(/\\s\*\s*\\s\*/g,\s*\'\\n\\n\'\)', 'healText(analysis.summary)', content)

# Also replace the simpler .replace(/\\n/g, '\n') used in CopyButton
content = re.sub(r'conn\.extractedInsight\.replace\(/\\\\n/g,\s*\'\\n\'\)', 'healText(conn.extractedInsight)', content)
content = re.sub(r'conn\.applicationToCurrent\.replace\(/\\\\n/g,\s*\'\\n\'\)', 'healText(conn.applicationToCurrent)', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Patch applied successfully again!')
