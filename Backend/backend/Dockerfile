FROM python:3.12-slim

# Dépendances système — ajout de g++ pour compiler GDAL
RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    libpq-dev \
    binutils \
    gcc \
    g++ \
    python3-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

# Installe GDAL Python selon la version système
RUN pip install --no-cache-dir GDAL==$(gdal-config --version)

# Copie et installe les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

CMD ["gunicorn", "backend.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "2", \
     "--timeout", "120"]