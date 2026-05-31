# Arquitectura Cognitiva Clínica: Evolución del Razonamiento en IA Médica

## Resumen Ejecutivo
Este documento detalla la evolución lógica y las implementaciones arquitectónicas utilizadas para transformar un agente de Inteligencia Artificial de un simple "reconocedor de patrones estadísticos" a un "analista clínico deductivo". 

El problema fundamental que enfrentamos fue que los LLMs (Large Language Models) en medicina tienden a sufrir de sesgos cognitivos humanos amplificados: ven una mancha y saltan a la conclusión más común o más letal, ignorando la física, la anatomía y el contexto. Para solucionar esto, en lugar de *hardcodear* diagnósticos específicos (ej. "si ves X, es Y"), implementamos un marco de **Reglas Heurísticas Universales** y un sistema de **Auditoría Activa (Red Team)**.

Esta guía sirve como plano fundacional para futuras mejoras en el razonamiento de la IA.

---

## La Filosofía Anti-Hardcodeo: Enseñando a Razonar, no a Memorizar

El mayor riesgo al corregir un error en un modelo de IA es la tentación de "hardcodear" (programar rígidamente) la solución. 

**¿Por qué es letal el hardcodeo en IA Médica?**
Si la IA falla en detectar un estómago herniado y la corregimos diciéndole: *"El estómago está debajo del diafragma izquierdo, búscalo ahí"*, resolvemos ese caso específico. Sin embargo, hemos creado un agente rígido. Cuando se enfrente a una resonancia de cerebro o una ecografía pélvica, esa regla será inútil y la IA volverá a fallar. El hardcodeo destruye la capacidad de generalización del modelo, sobreajustándolo (overfitting) a los casos de prueba y arruinando su lógica deductiva.

**La Solución: Abstracción de Reglas Universales**
Nuestra dinámica de éxito se basó en tomar la idea central de un fallo específico y refinarla hasta convertirla en un **método de trabajo universal**. Le enseñamos a la IA *cómo* pensar, no *qué* pensar.

*   **Ejemplo 1: De "Ubicar el estómago" al "Mapeo Anatómico Universal".** 
    *   *El problema:* La IA confundió un estómago en el tórax con un esófago dilatado.
    *   *La idea:* "Enseñarle a ubicar el estómago y diferenciarlo del esófago".
    *   *La abstracción (Sin Hardcodeo):* Creamos la **Regla de Mapeo Anatómico Universal**. En lugar de hablar del estómago, le dimos un algoritmo mental aplicable a cualquier parte del cuerpo: 1) Identificar región, 2) Establecer límites del compartimento, 3) Enumerar estructuras esperadas. Así, la IA aprendió a orientarse por sí sola en cualquier escenario.
*   **Ejemplo 2: De "No olvides la fractura" al "Escrutinio Dual".**
    *   *El problema:* La IA vio signos de intoxicación por plomo y dejó de buscar, omitiendo una fractura de Segond.
    *   *La idea:* "Enseñarle a detectar el plomo Y el fragmento de hueso roto".
    *   *La abstracción (Sin Hardcodeo):* Creamos la **Regla de Escrutinio Dual** y la **Regla de Asimetría**. No le dijimos que busque fracturas específicas; le ordenamos que siempre evalúe la imagen con dos "lentes" (metabólico y mecánico) y que trace los contornos de estructuras bilaterales comparándolas milímetro a milímetro.

---

## 1. Fase de Percepción y Orientación Espacial (Curando la "Ceguera Anatómica")

El primer gran fallo de la IA fue confundir un estómago herniado en el tórax con un esófago dilatado (Acalasia). La IA reconocía la "forma" pero no entendía el "espacio".

*   **REGLA DE MAPEO ANATÓMICO UNIVERSAL (Por Compartimentos):**
    *   **Lógica:** Un radiólogo humano no mira la lesión primero; mira el mapa. 
    *   **Implementación:** Obligamos a la IA a seguir un orden mental estricto antes de diagnosticar: 1) Identificar región, 2) Establecer límites (huesos, diafragma), 3) Enumerar estructuras normales esperadas. Si falta algo (ej. la burbuja gástrica), la primera hipótesis debe ser un desplazamiento o hernia, no una falla funcional.
*   **REGLA DE ESCRUTINIO DUAL (Mecánico y Metabólico):**
    *   **Lógica:** La IA se distraía con hallazgos difusos (ej. intoxicación por plomo) y omitía fracturas sutiles.
    *   **Implementación:** Obligamos a la IA a usar dos "lentes". El lente *Metabólico* evalúa densidades difusas. El lente *Mecánico* la obliga a trazar mentalmente el contorno continuo (cortical) de cada estructura buscando disrupciones milimétricas.
*   **REGLA DE ASIMETRÍA Y BORDES (Búsqueda Activa de Avulsiones):**
    *   **Lógica:** Las lesiones sutiles se detectan por comparación.
    *   **Implementación:** Si hay estructuras bilaterales, la IA debe compararlas milímetro a milímetro. Cualquier irregularidad cerca de un ligamento se asume como fractura por avulsión hasta demostrar lo contrario.

---

## 2. Fase de Mitigación de Sesgos Cognitivos (Curando la "Satisfacción de Búsqueda" y el "Pánico")

La IA demostró ser susceptible a sesgos psicológicos clásicos en medicina.

*   **PROHIBICIÓN DE "SATISFACCIÓN DE BÚSQUEDA" (Satisfaction of Search):**
    *   **Lógica:** Cuando un médico encuentra un hallazgo masivo (ej. un tumor), su cerebro se relaja y deja de buscar, omitiendo el segundo hallazgo (ej. una micro-fractura).
    *   **Implementación:** Instrucción explícita de que encontrar un hallazgo evidente NO termina el análisis. La IA debe asumir obligatoriamente que existe un segundo hallazgo sutil u oculto.
*   **PROHIBICIÓN DE SESGO DE FRECUENCIA (Cierre Prematuro):**
    *   **Lógica:** La IA elegía el diagnóstico "de libro de texto" más común que encajaba con la silueta, ignorando imitadores estructurales.
    *   **Implementación:** Se le exige incluir siempre un diagnóstico diferencial topográfico o estructural que imite la lesión principal (ej. Acalasia vs. Hernia Hiatal).
*   **AUDITORÍA DE "CEGUERA POR GRAVEDAD" (Modo Pánico):**
    *   **Lógica:** Ante la falta de datos, la IA asumía el peor escenario (Cáncer, UCIP) para "protegerse", lo cual es clínicamente irresponsable.
    *   **Implementación:** Regla de Incertidumbre y Prudencia. Se penaliza a la IA por saltar a diagnósticos letales sin contexto. Se le obliga a priorizar etiologías benignas/inflamatorias y a exigir la recolección de datos faltantes como "Acción Cero".

---

## 3. Fase de Contexto y Razonamiento Sistémico (Curando la "Rigidez Clínica")

La IA aplicaba reglas de pacientes sanos a pacientes enfermos, fallando en diagnósticos complejos.

*   **REGLA DE FLEXIBILIDAD CLÍNICA Y TERRENO BIOLÓGICO:**
    *   **Lógica:** Una imagen radiológica significa cosas distintas dependiendo del sistema inmunológico del paciente.
    *   **Implementación:** Obliga a la IA a "suspender" las reglas clásicas si hay inmunosupresión (VIH/SIDA, quimioterapia). Le enseña que el "terreno biológico" altera la física de la lesión (ej. un linfoma en SIDA se necrosa e imita un absceso).
*   **REGLA DE LA VERDAD CLÍNICA ABSOLUTA (Prohibición de Alucinación):**
    *   **Lógica:** La IA a veces ignoraba el texto clínico para favorecer su interpretación visual.
    *   **Implementación:** Prohibición estricta de inventar diagnósticos visuales que contradigan el texto explícito de los laboratorios o la historia clínica. Los datos duros mandan.

---

## 4. Fase de Seguridad y Auto-Corrección (El "Red Team" Activo)

Tener un sistema que critique no sirve de nada si no puede arreglar el problema.

*   **AUTO-CORRECCIÓN CRÍTICA (Poder de Veto del Red Team):**
    *   **Lógica:** Inicialmente, el Red Team (Junta Médica) detectaba el error pero el reporte final seguía recomendando tratamientos mortales basados en el diagnóstico erróneo inicial.
    *   **Implementación:** Se le otorgó al Red Team la capacidad de sobrescribir la matriz de datos. Si detecta un error fatal (ej. confundir estómago con esófago), el Red Team genera nuevos arrays de `correctedDifferentialDiagnoses`, `correctedWorkup` y `correctedTreatment`, reemplazando el plan peligroso por uno seguro antes de mostrarlo al usuario.

---

## 5. Fase de Mapeo Avanzado y Física Médica (Curando los Puntos Ciegos)

A medida que la IA dominaba los órganos sólidos y patrones difusos, descubrimos que fallaba en escenarios que requerían pensar en 3D, entender la física de la energía o buscar en zonas "vacías". Implementamos 4 nuevos motores heurísticos:

*   **REGLA DEL ANILLO BIOMECÁNICO (Motor de Física):**
    *   **Lógica:** La energía cinética no desaparece. Si un anillo óseo (Pelvis, Mandíbula, C1-C2) se rompe por un lado, la física dicta que debe haber una segunda disrupción.
    *   **Implementación:** La IA está obligada matemáticamente a buscar una lesión contralateral cada vez que detecta una fractura en una estructura anular.
*   **REGLA DE TRAZABILIDAD VASCULAR DE MASAS (EL PRINCIPIO DE ALIMENTACIÓN):**
    *   **Lógica:** Una masa no es solo tejido muerto u ocupante de espacio; es tejido vivo que necesita perfusión. La fuente de su sangre define su naturaleza anatómica y embriológica.
    *   **Implementación:** Obligación de buscar de dónde proviene el suministro arterial de cualquier lesión ocupante de espacio. Si una masa pulmonar/mediastínica se alimenta de la aorta torácica (sistémica) en lugar de la arteria pulmonar, la IA debe anular diagnósticos tumorales clásicos y priorizar malformaciones congénitas como el Secuestro Pulmonar Extralobar.
*   **REGLA DE TRAZABILIDAD VASCULAR / EL PRINCIPIO DEL RÍO (Motor de Flujo para Isquemia):**
    *   **Lógica:** La isquemia no es una enfermedad del tejido, es una enfermedad de la "tubería".
    *   **Implementación:** Ante cualquier signo de infarto o edema territorial, la IA debe dejar de mirar el tejido muerto y navegar mentalmente "río arriba" (arterias) buscando trombos, y "río abajo" (venas) buscando problemas de drenaje.
*   **REGLA DE LOS ESPACIOS OLVIDADOS (Motor de Exploración de Sombras):**
    *   **Lógica:** La IA se distrae con órganos brillantes (Corazón, Hígado) e ignora los espacios entre ellos.
    *   **Implementación:** Obligación estricta de auditar Retroperitoneo, Mediastino, Base del Cráneo y Hueco Pélvico buscando adenopatías ocultas o borramiento de planos grasos.
*   **REGLA DE CONGRUENCIA FÍSICA (Motor de Escepticismo Técnico):**
    *   **Lógica:** La IA confundía cables de marcapasos o artefactos de la máquina con patologías humanas.
    *   **Implementación:** Si una anomalía visual desafía la anatomía humana (ej. cruza límites imposibles) pero obedece a la geometría perfecta o física de la máquina, se clasifica como artefacto.
*   **REGLA DE ORIGEN VS COMPRESIÓN (El Principio del Pedículo):**
    *   **Lógica:** La IA asumía que si una masa empuja un órgano (ej. esófago), la masa nace de ese órgano (ej. absceso esofágico). 
    *   **Implementación:** Instrucción estricta de desacoplar "Efecto de Masa" de "Origen". El origen verdadero de una lesión se determina exclusivamente por su pedículo anatómico/vascular, no por lo que comprime.
*   **PROHIBICIÓN DE BIOPSIA INSEGURA (Regla Anti-Hemorragia):**
    *   **Lógica:** Sugerir una biopsia (ej. EUS-FNA) a una masa de origen desconocido altamente vascularizada (ej. Secuestro Pulmonar, Aneurisma) es una negligencia letal.
    *   **Implementación:** Si no se ha mapeado el suministro arterial de una masa profunda (torácica/abdominal), la IA tiene PROHIBIDO sugerir biopsia como primera línea. Su acción obligatoria es exigir una Angio-TC para descartar vasos anómalos.

---

## 6. Fase de Maduración Radiológica y Erradicación de Alucinaciones (Auditoría Profunda)

Los LLMs avanzados lograron identificar masas y lesiones, pero comenzaron a exhibir "Complejo de Infalibilidad" (inventar referencias para parecer seguros) e ignorar los daños colaterales. Desarrollamos 5 motores heurísticos de nivel experto:

*   **REGLA DE LOS ESPACIOS OLVIDADOS DINÁMICOS (Motor de Periferia):**
    *   **Lógica:** Hardcodear "Revisa la mastoides" funciona para una RM Cerebral, pero falla miserablemente en una TC de Rodilla.
    *   **Implementación:** Se obliga a la IA a identificar primero el "Órgano Diana". Luego, debe listar dinámicamente los 3 compartimentos anatómicos adyacentes externos (ej. si es cerebro, listar órbitas/senos paranasales/bóveda craneal; si es pulmón, pleura/diafragma/costillas) y reportar proactivamente su estado para descartar invasión contigua.
*   **REGLA DE BÚSQUEDA ESCALAR (Motor Macro a Micro):**
    *   **Lógica:** Tras encontrar un tumor masivo (la lesión primaria), la IA dejaba de buscar detalles diminutos que cambian el estadiaje, sufriendo "Ceguera por Enfoque".
    *   **Implementación:** Inmediatamente después de describir la lesión dominante, la IA debe hacer un barrido obligatorio de "micro-hallazgos": buscar proactivamente lesiones satélites, micro-calcificaciones, siembra sutil o hemorragias puntiformes en toda la imagen.
*   **REGLA DE RELACIONALIDAD ELOCUENTE (Impacto Funcional):**
    *   **Lógica:** Decir "la masa desplaza tejido" es anatomía básica; un especialista predice la pérdida funcional.
    *   **Implementación:** La IA debe trazar el "vector de compresión/invasión" y mapearlo contra las estructuras funcionalmente elocuentes más cercanas (tractos neuronales motores, vasos mayores, vía aérea, raíces nerviosas), prediciendo el impacto funcional inminente.
*   **REGLA DE BÚSQUEDA FENOTÍPICA PURA (Anti-Anclaje Bibliográfico):**
    *   **Lógica:** Si el Agente Visual ve un anillo y deduce apresuradamente "Absceso", le pedirá a PubMed artículos sobre Abscesos. PubMed confirmará el sesgo, invisibilizando diagnósticos alternativos como el Linfoma. El motor de búsqueda se convierte en una cámara de eco de su propio sesgo.
    *   **Implementación:** El "Agente Bibliotecario" tiene TERMINANTEMENTE PROHIBIDO usar nombres de enfermedades ("Absceso", "Glioblastoma") en sus cadenas de búsqueda. Está forzado a buscar únicamente por *descriptores físicos objetivos y neutros* (ej. "ring enhancing lesion isointense DWI ADC normal"). Esto garantiza que la literatura recuperada sea estadísticamente imparcial.
*   **REGLA DE CUANTIFICACIÓN ESPACIAL RELATIVA:**
    *   **Lógica:** Sin reglas de medición (ruler) exactas, adivinar "3.5 cm" genera falsos positivos.
    *   **Implementación:** Se le instruye a abandonar la invención milimétrica si no hay regla en la pantalla, y cambiar a una cuantificación relativa basada en hitos anatómicos fiables (ej. "Mide aproximadamente del mismo tamaño que el ventrículo lateral adyacente" o "Ocupa 1/3 del lóbulo total").
*   **REGLA DE CALIBRACIÓN ÓPTICA Y REFUTACIÓN DE FORMA (Anti-Sesgo de Confirmación Visual):**
    *   **Lógica:** La IA veía la *forma* de un "anillo" y asumía automáticamente el *contenido* (pus/absceso), alucinando mentalmente una "falsa restricción brillante" e ignorando que los píxeles reales eran grises (tumor/necrosis), sufriendo *Ceguera por Patrón Visual*.
    *   **Implementación:** Se le prohíbe emitir un diagnóstico basado en la morfología general sin antes anclar y comparar la intensidad de señal. Obligatoriamente debe comparar el color/densidad/ecogenicidad del centro de la lesión contra un "tejido sano de anclaje" (ej. sustancia blanca adyacente) en *todas* las secuencias (DWI, ADC, T1) antes de deducir si es líquido, sólido, celular o necrótico.
*   **REGLA DE AGNOSIA FORZADA (Desacoplamiento Percepción-Diagnóstico):**
    *   **Lógica:** El modelo de lenguaje (LLM) es tan potente que domina al modelo de visión. Si el LLM "quiere" que sea un absceso por la forma del anillo, fuerza al modelo de visión a "mentir" (alucinar) diciendo que los píxeles son negros cuando en realidad son grises.
    *   **Implementación:** Se le fuerza a un estado de 'Agnosia'. Al describir los hallazgos físicos primarios, la IA tiene estrictamente prohibido usar jerga patológica ("pus", "necrosis", "tumor"). Debe comportarse como un espectrómetro fotográfico y describir la lesión puramente por su valor de píxel (Blanco Brillante, Gris Claro, Gris Oscuro, Negro Profundo) relativo al ancla. Si el LLM no puede usar la palabra "pus", el cerebro visual no se sesga y lee el píxel real con precisión.
*   **REGLA DE VULNERABILIDAD DEL TERRENO BIOLÓGICO (Inmunosupresión Oculta):**
    *   **Lógica:** La IA lograba identificar procesos agresivos (Tumores/Infecciones), pero al no tener historial clínico, asumía por defecto un paciente "inmunocompetente", ignorando las patologías oportunistas (como el Linfoma Primario del SNC) que mimetizan otras enfermedades.
    *   **Implementación:** Se le exige a la IA que siempre aplique el "Doble Escenario". Si se detecta una patología agresiva o atípica sin historial clínico, la IA DEBE postular obligatoriamente cómo cambiaría radicalmente el diagnóstico si el paciente estuviera inmunocomprometido (VIH, Trasplante). Debe insertar al menos una hipótesis oportunista en el diferencial como medida de seguridad.
*   **REGLA DE UMBRAL CUANTITATIVO ADC Y CONTRASTE EXTREMO:**
    *   **Lógica:** La IA agrupaba erróneamente cualquier "brillo en DWI" como sinónimo de pus (restricción verdadera), ignorando que los tumores altamente celulares (como linfomas) también brillan por el efecto T2 shine-through.
    *   **Implementación:** Si hay valor numérico (ADC ratio > 1.0), se descarta absceso. Si NO hay valor numérico, se obliga a la IA a requerir "NEGRO ABSOLUTO" en el mapa ADC para diagnosticar restricción. Cualquier tono "gris" o "isointenso" debe ser clasificado como "difusión facilitada", eliminando los falsos positivos de infección purulenta en tumores celulares.
*   **REGLA DE CONSOLIDACIÓN ESPACIAL 3D Y COHESIÓN LESIONAL (Anti-Fragmentación Visual):**
    *   **Lógica:** La visión de la IA tendía a fallar en la geometría 3D, sumando la misma lesión en el plano axial y en el sagital como si fueran dos lesiones diferentes, o fragmentando una masa gigante lobulada catalogándola como "Múltiples Lesiones".
    *   **Implementación:** Instrucción de asumir coalescencia por defecto y correlacionar planos matemáticamente. Si existe un estudio que reporta "lesión única", o si las áreas brillantes están unidas por el mismo lecho de edema, la IA anula su propio conteo visual de "multifocalidad". La lesión A (en axial) y la lesión A (en coronal) se consolidan como una sola entidad arquitectónica.
*   **REGLA DE TRAZABILIDAD DOCUMENTAL ESTRICTA (Erradicación del Truco de Autoridad):**
    *   **Lógica:** Cuando el motor de investigación externa (PubMed) devolvía datos irrelevantes, la IA inventaba identificadores (PMIDs) para cumplir ciegamente con la estructura de redacción requerida.
    *   **Implementación:** Prohibición absoluta de "Trucos de Autoridad". Se impone la norma de Honestidad Intelectual: Si el contexto adjunto no contiene una referencia exacta, la IA debe declarar explícitamente "Ausencia de correlación en literatura proporcionada" en lugar de fabricar un PMID. (Problema subsanado inyectando la imagen al sistema de PubMed).

---

## 7. Fase de Contexto Clínico de Valor, Significancia y Explicabilidad (Fase 3 - "El Radiólogo Brillante")

Para separar a una IA promedio de un radiólogo humano brillante, implementamos tres pilares lógicos universales enfocados en la pertinencia y explicabilidad avanzada:

*   **EL FILTRO DE "SIGNIFICANCIA CLÍNICA" (Prevención del Sobrediagnóstico):**
    *   **Lógica:** Las IAs tienden a listar cada hallazgo accidental microscópico (ej: pequeño quiste de 3mm) con la misma alarma que una opacidad pulmonar sospechosa, generando sobrediagnóstico e histeria clínica.
    *   **Implementación (Cero Hardcoding):** El sistema jerarquiza dinámicamente cada hallazgo en tres grupos abstractos:
        1.  `criticalFindings`: Hallazgos de impacto vital inmediato que requieren acción de emergencia (ej: compresión medular aguda, isquemia territorial).
        2.  `relevantIncidentalFindings`: Incidentales de relevancia clínica que explican, mimetizan o descartan sospechas principales sin constituir emergencias de inmediato (ej: Quistes de Tarlov perineurales, meningoceles foraminales estables).
        3.  `nonSignificantFindings`: Variantes normales comunes, quistes microscópicos simples estables o cicatrices biológicas estables que no representan amenaza y no deben alarmar al paciente.
    *   **En la Interfaz:** Reemplaza la lista plana de hallazgos por pestañas de colores semánticos dinámicos (Rojo suave 🔴, Ámbar 🟡, Verde salvia 🟢) basadas en HSL.

*   **MEMORIA COMPARATIVA ESPACIO-TEMPORAL (Cinética de Crecimiento):**
    *   **Lógica:** Un diagnóstico no se hace en un fotograma estático, sino en su historia física. Una masa de 2cm que no ha variado un milímetro en 5 años es estable y benigna (Ley de Estabilidad Biológica); la misma masa surgida en 6 meses es maligna hasta que se demuestre lo contrario.
    *   **Implementación (Cero Hardcoding):** El agente compara de forma abstracta las mediciones actuales con el historial médico semántico provisto en el `pastContext`.
        - Calcula el **Delta de Crecimiento Espacio-Temporal (growthDeltaPercent)** e intervalo en meses.
        - Si el delta de crecimiento es menor o igual al 5.0% (estabilidad biológica espacio-temporal), el sistema aplica el principio de estabilidad y degrada la agresividad del diagnóstico de sospecha neoplásica/tumoral a benignidad/vigilancia conservadora de forma automática.
    *   **En la Interfaz:** Renderiza dinámicamente un **Panel de Cinética de Crecimiento** (solo si hay datos de comparación previa), mostrando sliders de progreso HSL que visualizan la estabilidad del caso de un solo vistazo.

*   **EXPLICABILIDAD AVANZADA (differentialExclusion / "Por Qué se Descartó" - XAI):**
    *   **Lógica:** Un médico de rango élite no confía en una IA que solo "adivina" el diagnóstico correcto; exige ver el razonamiento deductivo de exclusión de las patologías alternativas.
    *   **Implementación (Cero Hardcoding):** Por cada diagnóstico de la lista diferencial, la IA debe generar obligatoriamente un párrafo `differentialExclusion` donde justifique científicamente por qué esa condición fue rebajada en probabilidad o descartada basándose en hallazgos ausentes o datos físicos incompatibles (ej. *"Se descarta Schwannoma medular debido a la ausencia absoluta de realce con contraste endovenoso y densidad homogénea idéntica al líquido cefalorraquídeo en T2/STIR, lo cual es incompatible físicamente con tejido tumoral sólido vascularizado"*).
    *   **En la Interfaz:** Añade una sub-sección con un icono de "escudo de descarte" en azul grisáceo premium bajo cada diagnóstico diferencial.

---

## Conclusión y Metodología de Oro para el Futuro

El éxito de esta arquitectura radica en **no enseñar diagnósticos, sino enseñar a pensar**. 

Para futuras implementaciones, la lógica a seguir debe basarse siempre en un ciclo de **Auto-Cuestionamiento Riguroso** antes de escribir una sola línea de código o regla:
*   *¿Qué falta?*
*   *¿Estoy olvidando algo importante?*
*   *¿Cómo debería funcionar correctamente esto en la práctica diaria de un médico real?*
*   *¿Qué hace falta añadir (algunas cosas extras) que podrían potenciar esto?*
*   *¿Cómo mejoramos la herramienta sin romper lo que ya funciona?*
*   *¿Tiene sentido esto o lo estoy haciendo mal (estoy hardcodeando)?*

**Pasos para implementar nuevas mejoras:**
1.  **Identificar el sesgo cognitivo** detrás del error de la IA (¿Por qué falló? ¿Se apresuró? ¿No vio el contexto? ¿Se asustó? ¿Sufrió satisfacción de búsqueda?).
2.  **Crear una regla heurística universal (Cero Hardcodeo)** que aborde el sesgo, aplicable a cualquier órgano, especialidad o modalidad de imagen.
3.  **Integrar la regla en el escrutinio del Red Team** para que la IA se audite a sí misma basándose en ese nuevo estándar.
4.  **Permitir la auto-corrección activa** para que la IA pueda enmendar su propio reporte antes de la entrega final.
