from django.db import models

# Create your models here.
class Product(models.Model):
    name = models.CharField(max_length=100)
    unit = models.CharField(max_length=20)  # kg, packet, piece
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name