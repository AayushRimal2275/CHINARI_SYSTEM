from django.shortcuts import render, redirect, get_object_or_404
from .models import Inventory
from .forms import InventoryForm

def inventory_list(request):
    inventory = Inventory.objects.all().order_by('product__name')
    return render(request, 'inventory/list.html', {
        'objects': inventory,
        'add_url': 'inventory_create',
        'delete_url': 'inventory_delete',
        'title': 'Inventory',
        'edit_url': None,
    })

def inventory_create(request):
    if request.method == 'POST':
        form = InventoryForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('inventory_list')
    else:
        form = InventoryForm()
    return render(request, 'inventory/form.html', {'form': form, 'title': 'Add Inventory'})

def inventory_delete(request, inventory_id):
    item = get_object_or_404(Inventory, id=inventory_id)
    item.delete()
    return redirect('inventory_list')
