from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import GEOSGeometry
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from core.permissions import IsManagerOrReadOnly
import os, zipfile, shutil, traceback

PALM_TMP_DIR = "C:/tmp_palmgis_palms"


class PalmViewSet(viewsets.ModelViewSet):
    permission_classes = [IsManagerOrReadOnly]
    filter_backends    = [DjangoFilterBackend]
    filterset_fields   = ["etat_sante", "variete", "parcelle"]
    pagination_class   = None

    def get_queryset(self):
        from .models import Palm
        return Palm.objects.all()

    def get_serializer_class(self):
        from .serializers import PalmSerializer
        return PalmSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PalmImportView(APIView):
    parser_classes     = [MultiPartParser]
    permission_classes = [IsManagerOrReadOnly]

    def post(self, request):
        try:
            uploaded_file = request.FILES.get("file")
            print("=== DEBUT IMPORT PALMIERS ===")
            print("Fichier:", uploaded_file.name if uploaded_file else "AUCUN")

            if not uploaded_file:
                return Response({"error": "Aucun fichier fourni."}, status=400)

            os.makedirs(PALM_TMP_DIR, exist_ok=True)

            uploaded_path = os.path.join(PALM_TMP_DIR, "upload.zip")
            with open(uploaded_path, "wb") as f:
                for chunk in uploaded_file.chunks():
                    f.write(chunk)
            print("✅ Fichier sauvegardé")

            if uploaded_file.name.lower().endswith(".zip"):
                extract_dir = os.path.join(PALM_TMP_DIR, "extracted")
                os.makedirs(extract_dir, exist_ok=True)

                with zipfile.ZipFile(uploaded_path) as z:
                    z.extractall(extract_dir)
                    print("Extraits:", z.namelist())

                shp_files = []
                for root, dirs, files in os.walk(extract_dir):
                    for file in files:
                        if file.lower().endswith(".shp"):
                            shp_files.append(os.path.join(root, file))

                print("SHP trouvés:", shp_files)

                if not shp_files:
                    return Response(
                        {"error": "Aucun .shp trouvé dans le ZIP."},
                        status=400
                    )
                source_path = shp_files[0]

            elif uploaded_file.name.lower().endswith((".geojson", ".json")):
                source_path = uploaded_path
            else:
                return Response(
                    {"error": "Format non supporté. Utilisez .zip ou .geojson."},
                    status=400
                )

            print("Source path:", source_path)
            return self._importer(source_path, request.user)

        except Exception as e:
            print("=== ERREUR ===")
            print(traceback.format_exc())
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        finally:
            shutil.rmtree(PALM_TMP_DIR, ignore_errors=True)

    def _importer(self, source_path, user):
        from .models import Palm
        from parcels.models import Parcelle

        layer = None

        try:
            ds    = DataSource(source_path)
            layer = ds[0]
            print("=== Layer OK, features:", len(layer))
            print("=== Champs:", list(layer.fields))
        except Exception as e:
            return Response(
                {"error": f"Impossible de lire le fichier : {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        source_srid = layer.srs.srid if layer.srs else 26192
        field_names = list(layer.fields)
        print("=== SRID source:", source_srid)

        created, updated, errors = 0, 0, []

        for i, feature in enumerate(layer):
            code_uni = None
            try:
                if i < 3:
                    print(f"  Entité {i+1} — parcelle='{feature.get('parcelle')}', code_uni='{feature.get('code_uni')}'")

                geom = feature.geom.geos
                geom.srid = source_srid
                geom.transform(4326)

                code_uni   = feature.get("id")         if "id"         in field_names else None
                nom_parc   = feature.get("parcelle")   if "parcelle"   in field_names else None
                ligne      = feature.get("ligne")       if "ligne"      in field_names else ""
                numero     = str(feature.get("num"))    if "num"        in field_names else ""
                code_local = feature.get("code_local")  if "code_local" in field_names else ""
                variete    = feature.get("variete")     if "variete"    in field_names else ""
                sexe_raw   = feature.get("sexe")        if "sexe"       in field_names else "M"
                etat_sante = feature.get("etat_sante")  if "etat_sante" in field_names else \
                             feature.get("etat")         if "etat"       in field_names else "B"
                etat_site  = feature.get("etat_site")   if "etat_site"  in field_names else "ISO"
                date_val   = str(feature.get("date"))   if "date"       in field_names else ""

                                # ── Validation état site ──
                if etat_site not in ("ISO", "TOF", "V"):
                    etat_site = "ISO"

                # ── Sexe et âge — null si site vide ──
                if etat_site == "V":
                    sexe = None
                    age  = None
                else:
                    # Conversion sexe
                    sexe = "F" if sexe_raw and str(sexe_raw).lower() in (
                        "female", "f", "femelle"
                    ) else "M"
                    # Âge par défaut
                    if age not in ("JP", "A", "V"):
                        age = "A"

                # Rattachement par nom puis spatial
                parcelle = None
                if nom_parc:
                    parcelle = Parcelle.objects.filter(nom=nom_parc).first()
                    if i < 3:
                        print(f"  → Parcelle par nom '{nom_parc}': {parcelle}")
                if not parcelle:
                    parcelle = Parcelle.objects.filter(
                        geom__contains=GEOSGeometry(geom.wkt, srid=4326)
                    ).first()
                    if i < 3:
                        print(f"  → Parcelle spatiale: {parcelle}")

                palm, cree = Palm.objects.update_or_create(
                    code_uni=code_uni,
                    parcelle=parcelle,
                    defaults={
                        "geom":        GEOSGeometry(geom.wkt, srid=4326),
                        "ligne":       ligne or "",
                        "numero":      numero or "",
                        "code_local":  code_local or "",
                        "variete":     variete or "",
                        "sexe":        sexe,
                        "etat_sante":  etat_sante,
                        "etat_site":   etat_site,
                        "age":         "A",
                        "description": date_val or "",
                        "created_by":  user,
                    }
                )

                if cree:
                    created += 1
                    if i < 5:
                        print(f"✅ Créé : {code_uni}")
                else:
                    updated += 1
                    if i < 5:
                        print(f"🔄 Mis à jour : {code_uni}")

            except Exception as e:
                errors.append(f"Entité {i + 1} ({code_uni or '?'}) : {e}")
                print(f"❌ Entité {i + 1}:", e)

        print(f"=== {created} créés, {updated} mis à jour, {len(errors)} erreurs")

        return Response(
            {
                "created":        created,
                "updated":        updated,
                "errors":         errors,
                "total_features": len(layer),
            },
            status=status.HTTP_201_CREATED if (created + updated) > 0
                   else status.HTTP_400_BAD_REQUEST,
        )