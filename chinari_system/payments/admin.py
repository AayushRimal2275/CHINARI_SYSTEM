from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('vendor', 'sale', 'amount', 'payment_date')
    readonly_fields = ('payment_date',)
