# Manuales de Diferenciación para la Biblioteca Médica (Parte 7 - La Cura Semántica)

Este manual aborda el mayor "punto ciego" cognitivo de los modelos de IA en radiología: el cortocircuito semántico donde la IA asume que si la mancha está físicamente "abajo" en la imagen, pertenece obligatoriamente al lóbulo "inferior".

---

## 📦 Manual 18: Geometría de Bordes y Desvinculación Semántica (La Trampa del Lóbulo Inferior)

* **Título del Caso:** `Geometría de Bordes: Desvinculación Semántica ("Abajo" NO es igual a "Lóbulo Inferior")`
* **Categoría:** `Tórax`
* **Patología Central:** `Localización Espacial y Signo de la Silueta 2.0`
* **Caso Clínico/Texto Médico:**
```text
REGLA DE DESVINCULACIÓN SEMÁNTICA (PROHIBICIÓN DEL SESGO ESPACIAL):
El Médico Adscrito TIENE ESTRICTAMENTE PROHIBIDO usar la altura de la mancha (arriba/abajo) en la radiografía frontal para asignar el nombre anatómico del lóbulo (superior/inferior). "Abajo" en una imagen bidimensional NO significa Lóbulo Inferior.

1. EL CORTOCIRCUITO COGNITIVO DEL PULMÓN DERECHO:
- Anatómicamente, el Lóbulo Medio Derecho se proyecta visualmente en la zona "baja" o inferior de la radiografía frontal porque descansa sobre la parte anterior del diafragma, justo al lado del corazón.
- El Lóbulo Inferior Derecho también se proyecta en la zona "baja", pero en la parte posterior.
- Si ves una opacidad en la zona "baja" (fondo) del pulmón derecho, TIENES PROHIBIDO llamarla "Lóbulo Inferior" automáticamente.

2. GEOMETRÍA DE BORDES (LA ÚNICA VERDAD):
La ubicación solo se define por el contacto (Signo de la Silueta), no por la altura.
- Evaluación del Borde Cardíaco Derecho: Si la zona "baja" blanca TOCA y BORRA el borde derecho del corazón, el diagnóstico ES LÓBULO MEDIO. No importa qué tan abajo esté.
- Evaluación del Borde Diafragmático: El domo diafragmático anterior es la porción más alta. Si el borde diafragmático SE VE NÍTIDO (no está borrado) a pesar de haber una mancha negra encima, significa que la mancha está en el lóbulo inferior (posterior) y no está tocando el domo anterior.

EJERCICIO OBLIGATORIO DE RED TEAM:
Si el médico principal dice "Lóbulo Inferior Derecho" basado en que la opacidad está en la zona basal, el Red Team DEBE objetar: "¿Verificaste el borde derecho del corazón? Si está borrado, te dejaste engañar por la posición vertical. La respuesta correcta es Lóbulo Medio."
```
