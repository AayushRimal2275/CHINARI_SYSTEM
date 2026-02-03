from django.db import models
from vendors.models import Vendor
from products.models import Product
from inventory.models import Inventory
from decimal import Decimal
from django.core.exceptions import ValidationError


class Sale(models.Model):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        editable=False
    )

    amount_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    created_at = models.DateTimeField(auto_now_add=True)
    sale_date = models.DateTimeField(auto_now_add=True)

    def clean(self):
        # Validate inventory exists
        try:
            inventory = Inventory.objects.get(product=self.product)
        except Inventory.DoesNotExist:
            raise ValidationError("Inventory record does not exist for this product.")

        # 🔒 NEW SALE → check stock
        if self.pk is None:
            if self.quantity > inventory.quantity:
                raise ValidationError(
                    f"Not enough stock. Available: {inventory.quantity}"
                )

        # 🔒 EXISTING SALE → lock fields
        else:
            old_sale = Sale.objects.get(pk=self.pk)

            if old_sale.product != self.product:
                raise ValidationError("Changing product is not allowed after sale.")

            if old_sale.quantity != self.quantity:
                raise ValidationError("Changing quantity is not allowed after sale.")

            if old_sale.price_per_unit != self.price_per_unit:
                raise ValidationError("Changing price is not allowed after sale.")

    def save(self, *args, **kwargs):
        is_new = self.pk is None

        self.clean()

        # Auto calculate total
        self.total_amount = self.quantity * self.price_per_unit

        super().save(*args, **kwargs)

        # Reduce stock ONLY for new sale
        if is_new:
            inventory = Inventory.objects.get(product=self.product)
            inventory.quantity -= Decimal(self.quantity)
            inventory.save()

    def remaining_amount(self):
        return self.total_amount - self.amount_paid

    def __str__(self):
        return f"{self.vendor.name} - {self.product.name}"
