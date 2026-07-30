from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('palms', '0002_add_nombre_rejets'),  # ← nom exact
    ]

    operations = [
        # Corrige le type geom
        migrations.RunSQL(
            sql="""
                ALTER TABLE palms_palm
                ALTER COLUMN geom TYPE geometry(Point,4326)
                USING geom::geometry(Point,4326);
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
        # Ajoute la contrainte unique sur (code_uni + parcelle)
        migrations.RunSQL(
            sql="""
                ALTER TABLE palms_palm
                ADD CONSTRAINT palms_palm_code_uni_parcelle_unique
                UNIQUE (code_uni, parcelle_id);
            """,
            reverse_sql="""
                ALTER TABLE palms_palm
                DROP CONSTRAINT IF EXISTS palms_palm_code_uni_parcelle_unique;
            """,
        ),
    ]