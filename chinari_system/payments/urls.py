from django.urls import path
from . import views   

urlpatterns = [
    path('', views.payments_list, name='payments_list'),
    path('new/', views.payments_create, name='payments_create'),
    path('<int:payment_id>/delete/', views.payments_delete, name='payments_delete'),
]
