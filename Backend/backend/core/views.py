from django.http import JsonResponse
from django.views.decorators.http import require_GET
from rest_framework import viewsets
from rest_framework.routers import DefaultRouter
from core.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import UserSerializer

@require_GET
def health_check(request):
	return JsonResponse({"status": "ok"})
    
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """Retourne les infos de l'utilisateur actuellement connecté."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)