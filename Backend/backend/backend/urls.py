"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from core.registration_view import PalmGISRegisterView



urlpatterns = [
    path('admin/', admin.site.urls),
    # Authentification (login/logout/refresh via cookies)
    path('api/auth/', include('dj_rest_auth.urls')),

    path('api/auth/registration/', PalmGISRegisterView.as_view(), name='rest_register'),

    path('api-auth/', include('rest_framework.urls')),  # login/logout pour Browsable API

    path('api/', include('core.urls')),
    path('api/', include('interventions.urls')),
    #path('api/', include('dashboard.urls')),
    # ⬇ décommente au fur et à mesure que tu crées les urls.py de chaque app
    path('api/', include('parcels.urls')),
    path('api/', include('palms.urls')),
    path('api/', include('notifications.urls')),
    path("api/remote-sensing/", include("remote_sensing.urls")),   
    path("api/ai/", include("ai_predictions.urls")),   
    path("api/reports/", include("reports_app.urls")),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

