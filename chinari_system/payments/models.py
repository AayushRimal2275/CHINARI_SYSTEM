from django.db import models
from vendors.models import Vendor
from sales.models import Sale
from decimal import Decimal

class Payment(models.Model):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.vendor.name} paid {self.amount} on {self.payment_date.strftime('%Y-%m-%d')}"
