from django.db import models
from django.db.models import Sum
from decimal import Decimal
# Create your models here.
class Vendor(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def total_sold_amount(self):
        total = self.sale_set.aggregate(
            total=Sum('total_amount')
        )['total']
        return total or Decimal('0.00')

    def total_paid_amount(self):
        total = self.sale_set.aggregate(
            total=Sum('amount_paid')
        )['total']
        return total or Decimal('0.00')

    def total_due_amount(self):
        return self.total_sold_amount() - self.total_paid_amount()

    def __str__(self):
        return self.name