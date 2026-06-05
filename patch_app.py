import os

file_path = r'c:\Users\PC\Downloads\proyecto-medico-ia\src\App.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

heal_func = """
const healText = (text: string) => {
  if (!text || typeof text !== 'string') return text;
  let formatted = text
    .replace(/radiograf\\s*pa/gi, 'radiografía')
    .replace(/morfolog\\s*pa/gi, 'morfología')
    .replace(/anat\\s*pmica/gi, 'anatómica')
    .replace(/volum\\s*ptrpica/gi, 'volumétrica')
    .replace(/mediast\\s*p\\s*nico/gi, 'mediastínico')
    .replace(/extensi\\s*pn/gi, 'extensión')
    .replace(/descripci\\s*pn/gi, 'descripción')
    .replace(/precisi\\s*pn/gi, 'precisión')
    .replace(/medici\\s*pn/gi, 'medición')
    .replace(/lesi\\s*pn/gi, 'lesión')
    .replace(/adenopat\\s*pas/gi, 'adenopatías')
    .replace(/\\bpseas\\b/gi, 'óseas')
    .replace(/se\\s+alar/gi, 'señalar')
    .replace(/espec\\s+ficos/gi, 'específicos')
    .replace(/patolog\\s*pa/gi, 'patología')
    .replace(/ci\\s*pn/gi, 'ción')
    .replace(/log\\s*pa/gi, 'logía')
    .replace(/diagn\\s*stico/gi, 'diagnóstico')
    .replace(/diagn\\s*stica/gi, 'diagnóstica');
  return formatted.replace(/\\\\n/g, '\\n').replace(/<br\\s*\\/?>/gi, '\\n\\n').replace(/\\s* \\s*/g, '\\n\\n');
};

"""

if 'const healText' not in content:
    content = content.replace('export default function App() {', heal_func + 'export default function App() {')

old_replace = ".replace(/\\\\n/g, '\\n').replace(/<br\\s*\\/?>/gi, '\\n\\n').replace(/\\s* \\s*/g, '\\n\\n')"

content = content.replace('msg.content' + old_replace, 'healText(msg.content)')
content = content.replace('conn.extractedInsight' + old_replace, 'healText(conn.extractedInsight)')
content = content.replace('conn.applicationToCurrent' + old_replace, 'healText(conn.applicationToCurrent)')
content = content.replace('evalItem.critique' + old_replace, 'healText(evalItem.critique)')
content = content.replace('analysis.summary' + old_replace, 'healText(analysis.summary)')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Patch applied successfully!')
