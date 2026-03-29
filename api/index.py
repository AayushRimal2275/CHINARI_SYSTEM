import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "chinari_system"))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "chinari_system.settings")

from django.core.wsgi import get_wsgi_application  # noqa: E402

app = get_wsgi_application()
