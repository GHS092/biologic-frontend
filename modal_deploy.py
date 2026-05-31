import modal
import os

# Definir la aplicación en Modal
app = modal.App("biologic-backend-docker")

# Crear la imagen desde el Dockerfile local
# Esto subirá el Dockerfile a Modal, Modal clonará el repo de GitHub internamente y creará la imagen
image = modal.Image.from_dockerfile(
    "Dockerfile",
    force_build=True # Forzar la construcción siempre para traer los últimos commits del backend
)

# Definir la función web server
# Timeout generoso de 600 segundos (10 minutos) para tareas de IA profundas
@app.function(
    image=image,
    secrets=[modal.Secret.from_name("biologic-secrets")],
    timeout=600,
    min_containers=1 # Opcional: mantener una instancia activa para evitar arranques en frío
)
@modal.web_server(8000)
def fastapi_server():
    # En Modal web_server, no necesitamos devolver nada de Python. 
    # El decorador se encarga de exponer el puerto 8000 que arranca el CMD del Dockerfile.
    pass
