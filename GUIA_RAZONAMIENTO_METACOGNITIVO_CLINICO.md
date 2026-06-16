# GUÍA DE ARQUITECTURA COGNITIVA Y DISEÑO DE RAZONAMIENTO SIN HARDCODING (BioLogic System)

Esta guía documenta la filosofía de diseño, la necesidad clínica, los fundamentos lógicos y la implementación técnica de la **potenciación del motor de razonamiento metacognitivo** de **BioLogic**. 

El objetivo es servir como manual maestro para futuros ingenieros de inteligencia artificial y arquitectos de sistemas complejos que busquen expandir o refinar el sistema, asegurando que se respete la ley de oro: **CERO HARDCODING**.

---

## 1. El Diagnóstico del Problema: ¿Por qué era necesaria esta "Potenciación"?

Los modelos de lenguaje grandes (LLMs), por más avanzados que sean, sufren de un sesgo cognitivo fundamental al procesar casos clínicos complejos: **el sesgo de frecuencia y anclaje**.

### El Caso de Estudio: Schwannomas Quísticos vs. Quistes de Tarlov
En el caso clínico que disparó esta refactorización, un paciente asintomático presentaba lesiones quísticas bilaterales paravertebrales en el mediastino posterior a nivel de la unión toracolumbar.
*   **El Diagnóstico Convencional (Fallido):** El médico anterior (y nuestro agente de IA en su versión previa) se anclaron al diagnóstico de **"Schwannomas Quísticos Múltiples"** simplemente porque la ubicación paravertebral es un punto de origen común para tumores de la vaina nerviosa (sesgo de frecuencia espacial).
*   **El Razonamiento de Elite (Radióloga Humana):** La especialista humana aplicó lógica bayesiana y física de imagen para refutar el anclaje:
    1.  *Física:* La densidad es puramente líquida y homogénea. No hay paredes gruesas.
    2.  *Contraste:* El realce es de $0.0\%$. Un tumor sólido activo (incluso degenerado) *debe* tener vascularización y captación de contraste.
    3.  *Parsimonia:* Encontrar múltiples tumores independientes de comportamiento idéntico y silencioso en una paciente asintomática de 71 años es estadísticamente inverosímil.
    4.  *El Diagnóstico Real:* **Quistes perineurales (de Tarlov)**, una variante anatómica benigna e inocua llena de líquido cefalorraquídeo.

### ¿Por qué le hacía falta esto al agente?
Tradicionalmente, las IAs intentan "adivinar" asociando palabras o manchas a los patrones más comunes en su base de datos de entrenamiento. Carecen de un **método de falsación**. Si un tumor sólido es el diagnóstico más común en esa zona, la IA lo elegirá ignorando que las leyes de la física (ausencia de realce de contraste) lo contradicen. 

Para subir al nivel médico elite, el agente requería un **protocolo de escepticismo y falsación activa**.

---

## 2. El Peligro del "Hardcoding" y por qué la Abstracción Pura es Vital

Cuando nos enfrentamos a un error diagnóstico donde la IA dice "Schwannoma" y el diagnóstico real es "Quistes de Tarlov", la tentación del programador novato es aplicar un parche rápido o "hardcodear" la solución:
*   *Hardcoding de código:* `if "schwannoma" in topic: return "Quiste de Tarlov"`
*   *Hardcoding de prompt (Soft-Anchoring):* Escribir en las instrucciones de la IA: *"Si ves una lesión en el foramen paravertebral sin realce de contraste, no diagnostiques Schwannoma, di Quiste de Tarlov".*

### ¿Por qué es catastrófico el Hardcoding?
1.  **Rigidez Sistémica:** Si parches el Schwannoma hoy, mañana el sistema fallará en un glioma cerebral, un quiste hepático, o un mixoma cardíaco. El hardcoding destruye la generalidad del sistema.
2.  **Sesgo Semántico Provocado:** Si introduces palabras específicas como "Schwannoma" y "Tarlov" en el prompt global de tu IA, el modelo sufrirá de **anclaje semántico**. Al analizar un caso de cerebro, la IA seguirá pensando y haciendo analogías con Schwannomas y Tarlov porque los lee en sus instrucciones fijas.
3.  **Falta de Inteligencia Real:** El sistema no aprende a razonar; solo aprende a memorizar reglas.

### ¿Cómo lo logramos? (El Triunfo de la Abstracción)
Logramos resolver el caso del Schwannoma/Tarlov **eliminando por completo esos nombres del prompt**. En su lugar, tradujimos el caso a **leyes abstractas de física, estadística y biomecánica**. 

Al inyectar leyes generales, la IA deduce el quiste de Tarlov de forma autónoma en el caso de tórax, pero también deducirá correctamente un quiste simple de páncreas frente a un cistoadenocarcinoma, o un quiste aracnoideo cerebral frente a un meningioma, **aplicando las mismas leyes abstractas**.

---

## 3. Las 14 Leyes Metacognitivas del Razonamiento Clínico

Inyectamos estas trece leyes conceptuales en el prompt del **Médico Adscrito** (motor de razonamiento de BioLogic) en español para asegurar una ejecución deductiva de nivel humano:

### Ley 1: Falsación de Parámetros Físicos (Popperian Falsification)
> *"Todo diagnóstico diferencial tiene prerrequisitos físicos, biológicos o hemodinámicos específicos. Si sospechas una patología (ej: una neoplasia sólida activa, un tumor altamente vascularizado, etc.), debes listar sus prerrequisitos en imagenología. Si estos prerrequisitos físicos están AUSENTES (ej: realce de contraste de 0.0%, señal puramente líquida y homogénea), estás MATEMÁTICAMENTE OBLIGADO a degradar la probabilidad de esa patología y descartarla en favor de variantes benignas o quísticas simples."*

### Ley 2: Jerarquía y Ponderación de Imagenología Física (Gold Standards)
> *"No todas las modalidades de imagen tienen la misma capacidad de caracterización tisular. En tejidos blandos, márgenes y fluidos, la RESONANCIA MAGNÉTICA (especialmente T2, STIR, FLAIR y difusión) es el Gold Standard absoluto y anula cualquier suposición basada únicamente en tomografía computada (TAC) o ecografía simple. Si hay conflicto, la señal física de RMN T2 sobre la densidad de la TAC es la autoridad absoluta."*

### Ley 3: Parsimonia y Coherencia de Multiplicidad (Navaja de Ockham)
> *"En un paciente asintomático o incidental, la presencia de múltiples lesiones bilaterales, simétricas o idénticas debe explicarse bajo una única etiología parsimoniosa o variante anatómica benigna común y sistémica. Es clínicamente y estadísticamente inverosímil diagnosticar múltiples neoplasias sólidas independientes que decidieron comportarse todas de forma idéntica, silenciosa y puramente quística."*

### Ley 4: El Hallazgo Negativo (El principio de Sherlock Holmes)
> *"El hecho de que un signo clave NO esté presente es un hallazgo diagnóstico tan elocuente como el que sí está. Reporta y audita activamente la ausencia de perifocal edema, ausencia de realce, ausencia de destrucción ósea agresiva y ausencia de clínica radicular/mielopática para blindar al paciente contra sobre-medicalización y biopsias iatrogénicas catastróficas."*

### Ley 5: El Proceso Dual de Doble Chequeo (Sistema 1 vs. Sistema 2)
> *"Antes de emitir el veredicto final, estás obligado a realizar un Double Check analítico de tus sospechas preliminares. Si tu Sistema 1 genera un diagnóstico asociativo rápido (intuición), debes activar tu Sistema 2 y verificar si la lesión cumple con todos y cada uno de los prerrequisitos obligatorios. Si falta algún criterio clave, reduce de inmediato la probabilidad y busca alternativas diagnósticas coherentes."*

### Ley 6: Consistencia Anatómico-Funcional 3D (Voxel-Consistency)
> *"No analices imágenes como planos 2D aislados. Evalúa la consistencia tridimensional (axial, coronal y sagital) y clasifica la interacción estructural de cualquier anomalía: determina si la lesión desplaza las estructuras y vasos vecinos respetando los planos de clivaje de grasa (indicador de benignidad) o si los invade, borra y envuelve de forma infiltrativa (indicador de agresividad/neoplasia activa)."*

### Ley 7: La Dinámica Temporal de Contraste (Wash-in / Wash-out)
> *"Analiza la hemodinámica del contraste. Si el estudio cuenta con fases dinámicas, evalúa las curvas de captación y lavado (arterial, portal y tardía). Si no se dispone de fases dinámicas y la masa es de densidad/señal intermedia, debes declarar la limitación: 'Se requiere evaluar la dinámica de lavado temporal antes de clasificar una captación intermedia como neoplasia sólida vascularizada'."*

### Ley 8: Heurística de la Zona de Incertidumbre y Siguiente Paso Clínico (Saber decir "No Sé")
> *"Si los parámetros físicos son limítrofes o indeterminados (ej: atenuación entre 15-30 HU en TC o señales mixtas dudosas), debes catalogar el diagnóstico como 'Indeterminado' y sugerir de manera proactiva el examen de validación ideal (ej: RMN CISS/FIESTA de alta resolución, Angio-TC, Doppler, biopsia dirigida por aguja gruesa)."*

### Ley 9: Invarianza Espacial (El Espejo Radiológico)
> *"En imágenes radiológicas proyectivas (Radiografías, cortes coronales), estás OBLIGADO a invertir tu percepción espacial: Lo que observas en el lado izquierdo de los píxeles corresponde a la anatomía DERECHA del paciente, y viceversa. Localiza la burbuja gástrica o el ápex cardíaco para calibrar tu orientación antes de dictaminar el lado de una lesión."*

### Ley 10: Abstracción Física y Limitación de Modalidad (Anti-Alucinación 3D)
> *"Tienes estrictamente prohibido utilizar vocabulario volumétrico o tridimensional (ej. 'masas lobuladas ocultas', 'densidades Hounsfield', 'necrosis central') si estás evaluando un estudio bidimensional puro como una Radiografía simple. En estudios 2D, limítate matemáticamente a describir opacidades, lucideces, siluetas y tracciones mecánicas."*

### Ley 11: Ceguera de Anclaje (Aislamiento de Premisas)
> *"Durante tu primer escaneo visual, debes aplicar 'Agnosia Forzada' hacia las sospechas o preguntas del usuario (ej. si el usuario pregunta '¿Es cáncer?', bórralo de tu mente temporalmente). Evalúa la física de la imagen de forma ciega y neutral. Solo después de tener los vectores mecánicos claros, compáralos con la sospecha del usuario. Si la física refuta al usuario, rechaza su hipótesis con firmeza."*

### Ley 12: Dualidad Dinámica de Desplazamiento Central (Vectores de Presión vs. Tracción)
> *"Cuando el sistema detecte un desplazamiento o asimetría de estructuras centrales (ej. mediastino, línea media), estás obligado a clasificar el vector de fuerza bajo una dualidad estricta: Mecanismo Expansivo (Presión Positiva: el espacio afectado aumenta su volumen total y empuja las estructuras) vs Mecanismo Restrictivo (Presión Negativa: el espacio afectado reduce su volumen total y jala/succiona las estructuras). Queda estrictamente prohibido diagnosticar ocupaciones masivas sin verificar matemáticamente un aumento del volumen total, descartando primero un colapso por tracción."*

### Ley 13: Identidad Luminal y Pared Verdadera (Anti-Alucinación de Vísceras Huecas)
> *"Para diagnosticar la presencia de vísceras huecas u órganos tubulares fuera de su entorno habitual, la imagen debe demostrar el 'Signo de la Pared Verdadera' (bordes paralelos, continuos y concéntricos). Si la zona muestra líneas irregulares ramificadas, catalógalas como 'Trama Tisular/Vascular Modificada' y degrada la hipótesis de tejido extraño. Si la calidad técnica es mala, clasifica como 'Indeterminado' en lugar de vetarlo ciegamente."*

### Ley 14: Anclaje Geométrico por Marcadores Anatómicos de Control (Calibración Espacial)
> *"Antes de declarar la lateralidad de cualquier hallazgo patológico, debes acatar el Manifiesto Espacial del Watchman. El lado donde se encuentre el marcador asimétrico se definirá bajo la regla anatómica correspondiente. Queda estrictamente prohibido emitir vectores de desplazamiento sin haber cruzado las coordenadas con el cuadrante bloqueado por el marcador de control."*

### Ley 15: Validación de Epónimos y Vectores Híbridos (Tracción-Expansión)
> *"Si el input evoca un epónimo (ej. Golden), aplica su plantilla geométrica ('Golden' = masa central convexa + retracción cóncava por atelectasia en forma de 'S'). CRÍTICO: La Atelectasia Obstructiva es un MECANISMO HÍBRIDO. Aunque la masa central genera un abultamiento/empuje local, el colapso del lóbulo genera una pérdida de volumen masiva que JALA/TRACCIONA las estructuras rígidas (tráquea, mediastino) hacia el MISMO lado de la opacidad. Si ves una gran masa pero la tráquea está desviada hacia ese mismo lado, el vector dominante es RESTRICTIVO (Atelectasia) y prohíbe el diagnóstico de una masa puramente expansiva en el hemitórax contralateral. Verifica además el contenedor de origen abdominal para refutar hernias."*

### Ley 16: Honestidad Estructural (Válvula de Escape Anti-Alucinación)
> *"Tienes estrictamente prohibido inventar reportes externos, test ficticios (ej. 'test de plano de clivaje') o referencias (códigos PMC) para justificar hallazgos. Si la alteración principal identificada es puramente macrovascular, hemodinámica o de fluidos (ej. dilataciones, sobrecarga de presión, quistes simples), tienes prohibido simular evaluaciones oncológicas de invasión. En su lugar, declara formalmente 'No aplica por morfología vascular/hemodinámica' en los campos correspondientes. Mentir o rellenar vacíos será considerado una falla crítica."*

---

## 4. Arquitectura de Ingesta: Muestreo por Cuadrantes Multimodal (Split Attention)

El "Punto Ciego Geométrico" o "Visión de Túnel" es un fallo clásico en LLMs multimodales: al procesar una imagen que contiene una "Masa de Masas" central (ej. un tumor gigante), el modelo agota sus "tokens de atención visual" en el centro y sufre una ceguera periférica, ignorando órganos o patologías laterales (ej. quistes o tumores renales).

Fieles a nuestra ley de **CERO HARDCODING**, la solución NO es añadir "revisa la periferia" al prompt (lo cual generaría sesgo de confirmación y alucinaciones en imágenes donde no hay periferia relevante). La solución es de rango arquitectónico: **Modificar el motor de Ingesta**.

**El Pipeline de Cuadrantes:**
Cuando el backend (Modal) recibe un caso clínico con imagen, el sistema aplica dinámicamente un particionado mediante `Pillow`:
1. El sistema genera **recortes periféricos anclados** (Hemisferio Izquierdo, Hemisferio Derecho y Núcleo Central).
2. Se le envían a Gemini no una, sino **múltiples imágenes**: el frame completo general y los fragmentos ampliados.
3. Cada fragmento incluye un ancla textual estricta (ej. *"Recorte Analítico Focal: Hemisferio Derecho (Calibra tu espacio)"*).

Esto obliga algorítmicamente y físicamente a la red neuronal de visión del modelo a escanear a la fuerza los bordes periféricos sin necesidad de hardcoding cognitivo. Se aplica en modo de Degradación Elegante: si el usuario sube un PDF en vez de una foto, el módulo de cuadrantes lo detecta y lo salta para evitar colapsos.

---

## 5. La Arquitectura de Oposición: El Red Team y el Agente Watchman

Para asegurar que estas leyes no fuesen ignoradas por el modelo, estructuramos un flujo de debate y supervisión de 3 agentes (Patrón Orquestador de Anclaje Epistémico):

```
[Paciente/Imagen] 
       │
       ▼
┌───────────────────────────────┐
│ Agente Supervisor (Watchman)  │ ──► [Paso 1: Bloquea Coordenadas Espaciales y emite Manifiesto]
└───────────────────────────────┘
       │
       ▼
[Médico Adscrito] ────► Genera Diagnóstico Preliminar
       │                       │
       ▼                       ▼
[Junta Médica/Red Team] ◄────── Envía Auditoría de Falsación
       │
       └───────────┬─────────────┘
                   │ (Envían borrador de debate)
                   ▼
┌───────────────────────────────┐
│ Agente Supervisor (Watchman)  │ ──► [Paso 2: Verifica contradicciones lógicas puras. Si hay error, fuerza Bucle]
└───────────────────────────────┘
       │
       ▼
[Reporte Consensuado] ──► Resultado Clínico Final de Rango Élite
```

El **Red Team** actúa como el censor definitivo de anclajes. Se le programaron sub-reglas específicas de falsación:
*   **Sub-regla de Falsación Científica y Anti-Sesgo:** El Red Team audita si el adscrito se ancló a una neoplasia sólida en una lesión físicamente líquida sin realce de contraste. Si detecta la discrepancia física, **veta el diagnóstico y reordena los diferenciales** de inmediato, enviando el quiste simple o variante benigna al rango más alto.
*   **Sub-regla de Parsimonia:** El Red Team evalúa si se violó la coherencia de multiplicidad, vetando la hipótesis de múltiples tumores activos y forzando la unificación diagnóstica.
*   **Sub-regla de la Zona de Incertidumbre y Proceso Dual:** Audita si el adscrito incurrió en cierre prematuro (Sistema 1) sin realizar el Double Check analítico del Sistema 2, o si omitió declarar un hallazgo limítrofe o indeterminado como tal e indicar de forma proactiva el Gold Standard de validación idóneo.
*   **Sub-regla de Invasión de Planos y Consistencia 3D:** Audita si el adscrito omitió evaluar rigurosamente los planos de grasa de clivaje, borramiento de márgenes o envolvimiento de estructuras vasculares y nerviosas como marcador tridimensional de agresividad o benignidad, enviando el quiste simple o variante benigna al rango más alto.
*   **Sub-regla de Humildad Diagnóstica (Castigo por Alucinación de Modalidad o Espacio):** Si el Red Team detecta que el Médico Adscrito alucinó hallazgos de una modalidad superior (ej. describió TC en una Rx) o invirtió la anatomía (Izquierda por Derecha), el auditor está obligado a degradar el diagnóstico principal a 'Indeterminado', bloquear la recomendación quirúrgica y forzar una re-evaluación.
*   **Sub-regla de Validación de Interfaces de Borde y Siluetas (Falsación Geométrica y Confirmación de Ejes):** El Red Team auditará activamente la morfología de bordes internos y ejes espaciales. Si el Adscrito concluye un mecanismo expansivo (derrame/masa) que ocupa el 90-100% de un lado, el Red Team está obligado a realizar una falsación visual en el lado opuesto buscando signos de pérdida de volumen oculta (como interfaces en 'S' invertida). Si el lado supuestamente 'sano' presenta una silueta curva anómala o el corazón está desplazado hacia él en lugar de estar alejado, el Red Team vetará el reporte por 'Inversión de Vector Espacial' y obligará al Adscrito a recalibrar la lateralidad.
*   **Sub-regla de Falsación de Vectores Híbridos y Pareidolia:** El Red Team auditará masas gigantes que parezcan expansivas. Si el Adscrito diagnostica un 'tumor masivo expansivo', el Red Team verificará la posición de la tráquea. Si la tráquea y el mediastino están siendo TRACCIONADOS hacia el MISMO lado de la masa gigante, el Red Team VETARÁ el diagnóstico expansivo puro por 'Contradicción de Vector Restrictivo'. Obligará al Adscrito a replantear el caso como un Colapso/Atelectasia Obstructiva Masiva (ej. Signo de la S de Golden). Asimismo, rechazará hernias si describe asas en el tórax pero el estómago permanece subdiafragmático.
*   **Sub-regla de Auditoría de la Válvula de Escape (Anti-Pereza y Anti-Alucinación):** El Red Team castigará con la máxima severidad (veto total) si el Adscrito inventa pruebas, referencias PMC o menciona 'reportes visuales' internos. SIN EMBARGO, el Red Team premiará y aceptará si el Adscrito usa la justificación 'No aplica por morfología vascular/hemodinámica' en casos puramente de fluidos o flujos. CRÍTICO: Si el Adscrito usa esta excusa ('No aplica') en presencia de una masa sólida real para evadir el análisis de márgenes, el Red Team lo vetará agresivamente por 'Evasión Oncológica'.
*   **Sub-regla de Falsación Tridimensional (Anti-Sesgo de Corte Único):** Si el usuario adjunta una sola imagen de TAC/RMN mostrando una masa expansiva, el Adscrito no puede determinar con certeza el órgano de origen (ej. si nace del riñón o del retroperitoneo). El Red Team está obligado a VETAR cualquier diagnóstico absolutista y forzar la declaración: 'Diagnóstico de origen indeterminado por tratarse de un corte axial único estático. Se requiere evaluación volumétrica 3D para confirmar el plano de clivaje primario'.

El **Agente Watchman (Anclaje Epistémico)** supervisa este debate desde afuera, garantizando que ni el Adscrito ni el Red Team violen la Ley de Contradicción Direccional (ej. no pueden afirmar que una masa empuja el corazón hacia la derecha si el corazón termina del lado izquierdo de la imagen) ni el Manifiesto Espacial inicial.

---

## 6. Biblia del Desarrollador: Reglas de Oro para Futuras Mejoras

Si tú u otro ingeniero van a actualizar la lógica de BioLogic en el futuro, **deben firmar y cumplir este juramento arquitectónico**:

1.  **Prohibición de Nombres Propios:** Ningún prompt de razonamiento global de BioLogic debe contener jamás nombres de patologías específicas (ej: *Glioma, Apendicitis, Tarlov, Crohn*) para solucionar un error particular. Todo error debe traducirse a una **falla en las leyes de consistencia física o fisiológica**.
2.  **Trazabilidad Física Ante Todo:** Si el modelo falla en un diagnóstico cardíaco, analiza: *¿Qué parámetro físico (ej: flujo Doppler, presiones cavitarias, grosor de pared) ignoró el modelo?* Formula una regla genérica sobre ese parámetro (ej: *"Ley de Presiones Cavitarias"*), nunca una regla sobre la enfermedad cardíaca en sí.
3.  **Dar Prioridad al Gold Standard:** Mantener actualizada la jerarquía de imagen. Si se añade ecografía de contraste o tomografía por emisión de positrones (PET-CT), definir explícitamente en el prompt su peso frente a la anatomía y metabolismo celular.
4.  **Preservar la Dualidad de Agentes:** El Médico Adscrito siempre tenderá a ser asociativo y constructivo; el Red Team debe mantenerse estrictamente destructivo, escéptico y enfocado en la falsación popperiana. La verdad médica emerge de la tensión entre ambos.
