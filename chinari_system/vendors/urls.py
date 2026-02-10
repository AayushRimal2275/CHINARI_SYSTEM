from django.urls import path
from . import views

urlpatterns = [
    path('', views.vendors_list, name='vendors_list'),
    path('dashboard/', views.dashboard, name='vendors_dashboard'),
    path('new/', views.vendors_create, name='vendors_create'),
    path('<int:vendor_id>/statement/', views.vendor_statement, name='vendor_statement'),
    path('<int:vendor_id>/delete/', views.vendors_delete, name='vendors_delete'),
]
