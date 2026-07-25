from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import GEOSGeometry

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

import os
import zipfile
import shutil
import traceback

from core.permissions import IsManagerOrReadOnly
from .models import Parcelle
from .serializers import ParcelleSerializer

TMP_DIR = "C:/tmp_palmgis"


class ParcelleViewSet(viewsets.ModelViewSet):
    queryset = Parcelle.objects.all()
    serializer_class = ParcelleSerializer
    permission_classes = [IsManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["statut"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ParcelleImportView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsManagerOrReadOnly]

    def post(self, request):
        try:
            uploaded_file = request.FILES.get("file")
            print("=== DEBUT IMPORT ===")
            print("Fichier:", uploaded_file.name if uploaded_file else "AUCUN")

            if not uploaded_file:
                return Response({"error": "Aucun fichier fourni."}, status=400)

            os.makedirs(TMP_DIR, exist_ok=True)

            uploaded_path = os.path.join(TMP_DIR, "upload.zip")
            with open(uploaded_path, "wb") as f:
                for chunk in uploaded_file.chunks():
                    f.write(chunk)
            print("✅ Fichier sauvegardé")

            if uploaded_file.name.lower().endswith(".zip"):
                extract_dir = os.path.join(TMP_DIR, "extracted")
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
                        {"error": "Aucun .shp dans le ZIP."},
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
            shutil.rmtree(TMP_DIR, ignore_errors=True)

    from django.contrib.gis.gdal import DataSource
from django.contrib.gis.geos import GEOSGeometry

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

import os
import zipfile
import shutil
import traceback

from core.permissions import IsManagerOrReadOnly
from .models import Parcelle
from .serializers import ParcelleSerializer

TMP_DIR = "C:/tmp_palmgis"


class ParcelleViewSet(viewsets.ModelViewSet):
    queryset = Parcelle.objects.all()
    serializer_class = ParcelleSerializer
    permission_classes = [IsManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["statut"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ParcelleImportView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsManagerOrReadOnly]

    def post(self, request):
        try:
            uploaded_file = request.FILES.get("file")
            print("=== DEBUT IMPORT ===")
            print("Fichier:", uploaded_file.name if uploaded_file else "AUCUN")

            if not uploaded_file:
                return Response({"error": "Aucun fichier fourni."}, status=400)

            os.makedirs(TMP_DIR, exist_ok=True)

            uploaded_path = os.path.join(TMP_DIR, "upload.zip")
            with open(uploaded_path, "wb") as f:
                for chunk in uploaded_file.chunks():
                    f.write(chunk)
            print("✅ Fichier sauvegardé")

            if uploaded_file.name.lower().endswith(".zip"):
                extract_dir = os.path.join(TMP_DIR, "extracted")
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
                        {"error": "Aucun .shp dans le ZIP."},
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
            shutil.rmtree(TMP_DIR, ignore_errors=True)

    def _importer(self, source_path, user):
        print("=== _importer appelé avec:", source_path)
        try:
            ds    = DataSource(source_path)
            layer = ds[0]
            print("=== Layer OK, features:", len(layer))
        except Exception as e:
            print("=== ERREUR DataSource:", e)
            return Response(
                {"error": f"Impossible de lire le fichier : {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        source_srid = layer.srs.srid if layer.srs else None

        # layer.fields retourne directement des strings
        field_names = list(layer.fields)
        print("=== Champs disponibles:", field_names)

        nom_field = next(
            (f for f in ["nom", "NOM", "Nom", "name", "NAME"] if f in field_names),
            None
        )
        print("=== Champ nom utilisé:", nom_field)

        created, errors = 0, []

        for i, feature in enumerate(layer):
            try:
                geom = feature.geom.geos

                if source_srid:
                    geom.srid = source_srid
                    geom.transform(4326)
                elif not geom.srid:
                    geom.srid = 4326

                if geom.geom_type == "MultiPolygon":
                    geom = geom[0]

                nom = (
                    feature.get(nom_field)
                    if nom_field
                    else f"Parcelle importée {i + 1}"
                )

                Parcelle.objects.create(
                    nom=nom,
                    geom=GEOSGeometry(geom.wkt, srid=4326),
                    created_by=user,
                )
                created += 1
                print(f"✅ Parcelle {i+1} créée : {nom}")

            except Exception as e:
                errors.append(f"Entité {i + 1} : {e}")
                print(f"❌ Entité {i+1} erreur:", e)

        print(f"=== Import terminé : {created} créées, {len(errors)} erreurs")

        return Response(
            {
                "created":        created,
                "errors":         errors,
                "total_features": len(layer),
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST,
        )