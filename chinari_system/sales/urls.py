from django.urls import path
from . import views

urlpatterns = [
    path('', views.sales_list, name='sales_list'),
    path('new/', views.sales_create, name='sales_create'),
    path('<int:sale_id>/delete/', views.sales_delete, name='sales_delete'),
]
