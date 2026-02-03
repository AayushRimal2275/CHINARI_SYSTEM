from django.contrib import admin
from .models import Sale

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = (
        'vendor',
        'product',
        'quantity',
        'price_per_unit',
        'total_amount',
        'created_at',
    )

    readonly_fields = (
        'vendor',
        'product',
        'quantity',
        'price_per_unit',
        'total_amount',
        'created_at',
    )
    def has_change_permission(self, request, obj = None):
        return False
    def has_delete_permission(self, request, obj = None):
        return False
