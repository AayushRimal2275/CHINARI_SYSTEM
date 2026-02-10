from django.urls import path
from . import views

urlpatterns = [
    path('', views.inventory_list, name='inventory_list'),
    path('new/', views.inventory_create, name='inventory_create'),
    path('<int:inventory_id>/delete/', views.inventory_delete, name='inventory_delete'),
]