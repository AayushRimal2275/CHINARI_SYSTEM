from django.urls import path
from . import views 

urlpatterns = [
    path('', views.products_list, name='products_list'),
    path('new/', views.products_create, name='products_create'),
    path('<int:product_id>/edit/', views.products_edit, name='products_edit'),
    path('<int:product_id>/delete/', views.products_delete, name='products_delete'),
]