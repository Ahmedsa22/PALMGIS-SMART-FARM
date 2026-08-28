#!/bin/bash
set -e

echo "⏳ Attente de PostgreSQL..."
until pg_isready -h db -p 5432 -U postgres; do
  sleep 2
done

echo "✅ PostgreSQL prêt"

COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h db -U postgres -d Palm_GIS -tAc \
  "SELECT COUNT(*) FROM information_schema.tables \
   WHERE table_schema='public'" 2>/dev/null || echo "0")

COUNT=$(echo $COUNT | tr -d '[:space:]')

if [ "$COUNT" -lt "5" ]; then
  echo "📦 Restauration de la base de données..."
  PGPASSWORD=$DB_PASSWORD pg_restore \
    -h db \
    -U postgres \
    -d Palm_GIS \
    --no-owner \
    --no-privileges \
    /app/palmgis_backup.dump
  echo "✅ Base restaurée"
else
  echo "✅ Base déjà initialisée ($COUNT tables)"
fi

echo "🔄 Application des migrations..."
python manage.py migrate --noinput

echo "🚀 Démarrage de Django..."
exec gunicorn backend.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 2 \
  --timeout 120