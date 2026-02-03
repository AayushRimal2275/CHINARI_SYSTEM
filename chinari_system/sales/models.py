from django.db import models
from vendors.models import Vendor
from products.models import Product
from inventory.models import Inventory
from decimal import Decimal
from django.core.exceptions import ValidationError

class Sale(models.Model):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name="sales")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        # Validate inventory exists
        try:
            inventory = Inventory.objects.get(product=self.product)
        except Inventory.DoesNotExist:
            raise ValidationError("Inventory record does not exist for this product.")

        if self.pk is None:  # new sale → check stock
            if self.quantity > inventory.quantity:
                raise ValidationError(f"Not enough stock. Available: {inventory.quantity}")
        else:  # existing sale → lock fields
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

        # Auto-calculate total
        self.total_amount = self.quantity * self.price_per_unit

        super().save(*args, **kwargs)

        # Reduce stock on new sale
        if is_new:
            inventory = Inventory.objects.get(product=self.product)
            inventory.reduce_stock(self.quantity)

    def __str__(self):
        return f"{self.vendor.name} - {self.product.name}"
