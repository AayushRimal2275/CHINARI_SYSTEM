from django.db import models
from decimal import Decimal

class Vendor(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def total_sold_amount(self):
        return sum(sale.total_amount for sale in self.sales.all())

    def total_paid_amount(self):
        return sum(payment.amount for payment in self.payments.all())

    def total_due_amount(self):
        return self.total_sold_amount() - self.total_paid_amount()

    def is_fully_paid(self):
        return self.total_due_amount() <= 0

    def __str__(self):
        return self.name
