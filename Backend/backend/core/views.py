from django.http import JsonResponse
from django.views.decorators.http import require_GET
from rest_framework import viewsets, status
from rest_framework.routers import DefaultRouter
from core.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserSerializer
from core.permissions import IsManagerOrReadOnly


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



class UtilisateursView(APIView):
    """
    GET /api/users/ → liste tous les utilisateurs sauf soi-même (managers)
    """
    permission_classes = [IsManagerOrReadOnly]

    def get(self, request):
        users = User.objects.all().order_by("date_joined")
        data = [
            {
                "id":          u.id,
                "username":    u.username,
                "email":       u.email,
                "role":        u.role,
                "is_active":   u.is_active,
                "date_joined": u.date_joined.strftime("%d/%m/%Y"),
            }
            for u in users
            if u.id != request.user.id
        ]
        return Response(data)


class PromouvoirUtilisateurView(APIView):
    """
    PATCH /api/users/{user_id}/role/
    { "role": "manager" | "viewer", "is_active": true | false }
    """
    permission_classes = [IsManagerOrReadOnly]

    def patch(self, request, user_id):
        if request.user.role != "manager":
            return Response(
                {"error": "Seul un manager peut modifier les rôles."},
                status=status.HTTP_403_FORBIDDEN
            )

        if str(request.user.id) == str(user_id):
            return Response(
                {"error": "Vous ne pouvez pas modifier votre propre rôle."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Utilisateur introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )

        nouveau_role = request.data.get("role")
        is_active    = request.data.get("is_active")

        if nouveau_role and nouveau_role in ("manager", "viewer"):
            user.role = nouveau_role

        if is_active is not None:
            user.is_active = bool(is_active)

        user.save()

        return Response({
            "message":   f"Utilisateur {user.username} mis à jour.",
            "id":        user.id,
            "username":  user.username,
            "role":      user.role,
            "is_active": user.is_active,
        })

class SimpleRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email    = request.data.get('email')
        password = request.data.get('password1') or request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'username et password sont requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Ce nom utilisateur existe deja'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.create_user(
                username=username,
                email=email or '',
                password=password,
            )
            user.role = 'viewer'
            user.save()
            return Response(
                {'message': f'Utilisateur {username} cree avec succes'},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )