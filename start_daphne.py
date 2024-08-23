import os
import sys
from daphne.cli import CommandLineInterface


#* Définir la variable d'environnement pour les paramètres Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')


#* Initialiser Django avant d'importer d'autres modules
import django
django.setup()

#* Passer les arguments de la ligne de commande à Daphne
sys.argv = ["daphne", "-p", "8000", "project.asgi:application"]
CommandLineInterface.entrypoint()
