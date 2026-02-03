from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import Sale
from inventory.models import Inventory


@receiver(post_delete, sender=Sale)
def restore_inventory_on_sale_delete(sender, instance, **kwargs):
    inventory = Inventory.objects.get(product=instance.product)
    inventory.quantity += instance.quantity
    inventory.save()
