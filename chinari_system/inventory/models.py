from django.db import models
from products.models import Product
from decimal import Decimal
from django.core.exceptions import ValidationError

class Inventory(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    last_updated = models.DateTimeField(auto_now=True)

    def reduce_stock(self, qty):
        if self.quantity < Decimal(qty):
            raise ValidationError(f"Not enough stock for {self.product.name}")
        self.quantity -= Decimal(qty)
        self.save()

    def __str__(self):
        return f"{self.product.name} - {self.quantity}"
