from django.contrib import admin
from django.utils.html import format_html
from decimal import Decimal

from .models import Vendor
from sales.models import Sale
from payments.models import Payment


class SaleInline(admin.TabularInline):
    model = Sale
    extra = 0
    can_delete = False
    readonly_fields = (
        'product',
        'quantity',
        'price_per_unit',
        'total_amount',
        'created_at',
    )


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 1
    fields = ('amount', 'payment_date', 'notes')
    readonly_fields = ('payment_date',)


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'total_sold_amount',
        'total_paid_amount',
        'colored_due',
    )

    inlines = [SaleInline, PaymentInline]

    @admin.display(description="Total Due")
    def colored_due(self, obj):
        due = obj.total_due_amount()

        if due > Decimal('0.00'):
            return format_html(
                '<span style="color:red; font-weight:bold;">{}</span>',
                due
            )

        return format_html(
            '<span style="color:green; font-weight:bold;">{}</span>',
            due
        )
