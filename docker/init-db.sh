#!/bin/bash
set -e

echo "⏳ Attente de PostgreSQL..."
until pg_isready -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER}; do
  sleep 2
done

echo "✅ PostgreSQL prêt"
echo "DB_HOST: ${DB_HOST}"
echo "DB_PORT: ${DB_PORT}"
echo "DB_NAME: ${DB_NAME}"

COUNT=$(PGPASSWORD=${DB_PASSWORD} psql \
  -h ${DB_HOST} \
  -p ${DB_PORT} \
  -U ${DB_USER} \
  -d ${DB_NAME} \
  -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" \
  2>/dev/null || echo "0")

COUNT=$(echo $COUNT | tr -d '[:space:]')
echo "Tables existantes: ${COUNT}"

if [ "${COUNT}" -lt "5" ]; then
  echo "📦 Restauration de la base de données..."
  PGPASSWORD=${DB_PASSWORD} pg_restore \
    -h ${DB_HOST} \
    -p ${DB_PORT} \
    -U ${DB_USER} \
    -d ${DB_NAME} \
    --no-owner \
    --no-privileges \
    /app/palmgis_backup.dump && echo "✅ Base restaurée" || echo "⚠️ pg_restore avec avertissements"
else
  echo "✅ Base déjà initialisée (${COUNT} tables)"
fi

echo "🔄 Application des migrations..."
python manage.py migrate --noinput

echo "🚀 Démarrage de Django..."
exec gunicorn backend.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 2 \
  --timeout 120