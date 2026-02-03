from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path(
        "vendor/<int:vendor_id>/statement/",
        views.vendor_statement,
        name="vendor_statement",
    ),
]
