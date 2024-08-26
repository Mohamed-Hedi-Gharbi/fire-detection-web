import os
from pathlib import Path
from django.contrib.messages import constants as messages

if os.name == 'nt':
    VENV_BASE = os.environ['VIRTUAL_ENV']
    os.environ['PATH'] = os.path.join(VENV_BASE, 'Lib\\site-packages\\osgeo') + ';' + os.environ['PATH']
    os.environ['PROJ_LIB'] = os.path.join(VENV_BASE, 'Lib\\site-packages\\osgeo\\data\\proj')


#* Construction des chemins à l'intérieur du projet
BASE_DIR = Path(__file__).resolve().parent.parent

#* Clé secrète pour le déploiement
SECRET_KEY = 'django-insecure-o0$9+icstx@*4vthy_ufg^o0&q-5p-ydqf9oh_idqvn9xd3@wd'

#* Mode debug (à désactiver en production)
DEBUG = True

ALLOWED_HOSTS = ['195.35.24.22', '*']

#* Définition des applications installées
INSTALLED_APPS = [
    'daphne',
    'channels',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'location_field',
    'home',
    'authentication',
    'supervisor',
    'client',
]

#* Middleware
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'authentication.middlewares.SeparateSessionMiddleware',  #* Chemin complet de votre middleware
]

#* Configuration WhiteNoise
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

#* Configuration de l'URL racine
ROOT_URLCONF = 'project.urls'

#* Configuration des templates
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]   

#* Configuration WSGI et ASGI
WSGI_APPLICATION = 'project.wsgi.application'
ASGI_APPLICATION = 'project.asgi.application'

#* Configuration de Channels
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

#* Configuration de la base de données
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': 'fire_detection',
        'USER': 'root',
        'PASSWORD': 'root',
        'HOST': '195.35.24.22',
        'PORT': '5432',
    }
}

#* Validation des mots de passe
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

#* Internationalisation
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

#* Configuration des fichiers statiques
STATIC_URL = '/static/'  # Assurez-vous que ce chemin est correct
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = 'img/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'img/')

#* Configuration de la clé primaire par défaut
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

#* Configuration des e-mails
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'mohamedhedigharbi101@gmail.com'
EMAIL_HOST_PASSWORD = 'pacesqcanahtmpks'

#* Configuration des messages
MESSAGE_TAGS = {
    messages.DEBUG: 'debug',
    messages.INFO: 'info',
    messages.SUCCESS: 'success',
    messages.WARNING: 'warning',
    messages.ERROR: 'danger',
}
