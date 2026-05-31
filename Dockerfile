FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Instalar dependencias del sistema y git
RUN apt-get update && \
    apt-get install -y --no-install-recommends git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clonar el backend directamente de GitHub
RUN git clone --depth 1 https://github.com/GHS092/biologic-backend-modal.git .

# Instalar uvicorn (para ejecutar el servidor web directamente) y las dependencias del backend
RUN pip install --no-cache-dir uvicorn && \
    pip install --no-cache-dir -r requirements.txt

# Exponer el puerto
EXPOSE 8000

# Arrancar uvicorn directamente en el objeto web_app
CMD ["uvicorn", "app:web_app", "--host", "0.0.0.0", "--port", "8000"]
