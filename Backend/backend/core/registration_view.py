from dj_rest_auth.registration.views import RegisterView

class PalmGISRegisterView(RegisterView):
    """
    Fix: passe request._request (Django HttpRequest) à allauth
    au lieu de request (DRF Request) pour éviter l'erreur session.
    """
    def perform_create(self, serializer):
        # ← passe le vrai HttpRequest Django à allauth
        user = serializer.save(self.request._request)
        return user