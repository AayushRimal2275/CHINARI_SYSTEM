from django.shortcuts import render, redirect, get_object_or_404
from .models import Sale
from .forms import SaleForm
from django.utils import timezone
from datetime import timedelta

def sales_list(request):
    days = int(request.GET.get('days', 30))
    start_date = timezone.now() - timedelta(days=days)
    sales = Sale.objects.filter(created_at__gte=start_date).order_by('-created_at')
    return render(request, 'sales/list.html', {
        'objects': sales,
        'days': days,
        'add_url': 'sales_create',
        'delete_url': 'sales_delete',
        'title': 'Sales',
        # 'edit_url': None,
    })

def sales_create(request):
    if request.method == 'POST':
        form = SaleForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('sales_list')
    else:
        form = SaleForm()
    return render(request, 'sales/form.html', {'form': form, 'title': 'Add Sale'})

def sales_delete(request, sale_id):
    sale = get_object_or_404(Sale, id=sale_id)
    sale.delete()
    return redirect('sales_list')
