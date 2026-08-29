import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# GDAL/GEOS — Windows uniquement
if os.name == 'nt':
    GDAL_LIBRARY_PATH = "C:/Users/hp/miniconda3/envs/palmgis/Library/bin/gdal.dll"
    GEOS_LIBRARY_PATH = "C:/Users/hp/miniconda3/envs/palmgis/Library/bin/geos_c.dll"

# Charge .env seulement en développement local
if os.getenv('DOCKER_ENV') != 'true':
    from dotenv import load_dotenv
    load_dotenv(os.path.join(BASE_DIR, '.env'))

# ← SECRET_KEY depuis variable d'environnement
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-fallback-key-dev-only')

DEBUG = os.getenv('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')


# Application definition

INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.gis",
    "django.contrib.sites",       # requis par dj-rest-auth

    # Tiers
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_gis",
    "corsheaders",
    "django_filters",
    "dj_rest_auth",
    "dj_rest_auth.registration", 
    "allauth",                    
    "allauth.account",
    "allauth.socialaccount",

    # Tes apps métier
    "core",
    "parcels",
    "palms",
    "interventions",
    "notifications",
    "remote_sensing",
    "ai_predictions",
    "dashboard",
    "reports_app",
]

SITE_ID = 1  # requis par django.contrib.sites

AUTH_USER_MODEL = "core.User"


ACCOUNT_EMAIL_VERIFICATION = "none"    # ← pas de vérification email
ACCOUNT_LOGIN_METHODS = {'username'}
ACCOUNT_SIGNUP_FIELDS = ['email', 'username*', 'password1*', 'password2*']
ACCOUNT_EMAIL_REQUIRED = False

# Configuration GeoServer
GEOSERVER_URL = "http://localhost:8080/geoserver"
GEOSERVER_USER = "admin"
GEOSERVER_PASSWORD = "geoserver"
GEOSERVER_WORKSPACE = "palmgis"


COPERNICUS_USER     = os.getenv("COPERNICUS_USER", "")
COPERNICUS_PASSWORD = os.getenv("COPERNICUS_PASSWORD", "")


SENTINEL_DATA_DIR = "C:/sentinel_data"

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",   
]

#for allowing all origins (not recommended for production)
# CORS_ALLOW_ALL_ORIGINS = True but for now
CORS_ALLOW_ALL_ORIGINS = DEBUG  # Allow all origins in development, restrict in production



ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE":   "django.contrib.gis.db.backends.postgis",
        "NAME":     os.getenv("DB_NAME",     "Palm_GIS"),
        "USER":     os.getenv("DB_USER",     "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", "geoinfo"),
        "HOST":     os.getenv("DB_HOST",     "db"),      # ← "db" par défaut
        "PORT":     os.getenv("DB_PORT",     "5432"),    # ← "5432" par défaut
    }
}

# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]




REST_AUTH = {
    "USE_JWT": True,
    "JWT_AUTH_COOKIE": "palmgis_access_cookie",
    "JWT_AUTH_REFRESH_COOKIE": "palmgis_refresh_cookie",
    "JWT_AUTH_HTTPONLY": True,       # empêche JS de lire le cookie (protection XSS)
    "JWT_AUTH_SAMESITE": "Lax",      # protection CSRF de base
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "dj_rest_auth.jwt_auth.JWTCookieAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "core.permissions.IsManagerOrReadOnly",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,   # un nouveau refresh token est émis à chaque refresh
}






# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Africa/Casablanca'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / "static"


MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
