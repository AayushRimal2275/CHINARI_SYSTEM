from django.contrib import admin
from .models import Sale

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('id', 'vendor', 'total_amount', 'amount_paid', 'created_at')
    readonly_fields = ('created_at',)
