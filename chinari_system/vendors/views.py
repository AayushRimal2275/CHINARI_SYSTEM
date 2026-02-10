from django.shortcuts import render, redirect, get_object_or_404
from .models import Vendor
from .forms import VendorForm
from sales.models import Sale
from payments.models import Payment
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

def vendors_list(request):
    vendors = Vendor.objects.all()
    return render(request, 'vendors/list.html', {
        'objects': vendors,
        'add_url': 'vendors_create',
        'delete_url': 'vendors_delete',
        'title': 'Vendors',
        'edit_url': None,
    })

def vendors_create(request):
    if request.method == 'POST':
        form = VendorForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('vendors_list')
    else:
        form = VendorForm()
    return render(request, 'vendors/form.html', {'form': form, 'title': 'Add Vendor'})

def vendors_delete(request, vendor_id):
    vendor = get_object_or_404(Vendor, id=vendor_id)
    vendor.delete()
    return redirect('vendors_list')

# Vendor Statement
def vendor_statement(request, vendor_id):
    vendor = get_object_or_404(Vendor, id=vendor_id)
    days = int(request.GET.get("days", 30))
    start_date = timezone.now() - timedelta(days=days)
    sales = Sale.objects.filter(vendor=vendor, created_at__gte=start_date).order_by("created_at")
    payments = Payment.objects.filter(vendor=vendor, payment_date__gte=start_date).order_by("payment_date")
    total_sales = sum(s.total_amount for s in sales)
    total_payments = sum(p.amount for p in payments)
    closing_due = total_sales - total_payments
    return render(request, "vendors/statement.html", {
        "vendor": vendor,
        "sales": sales,
        "payments": payments,
        "days": days,
        "total_sales": total_sales,
        "total_payments": total_payments,
        "closing_due": closing_due,
    })

# Dashboard
def dashboard(request):
    vendors = Vendor.objects.all()
    vendor_data = []
    total_due = Decimal("0.00")
    for vendor in vendors:
        due = vendor.total_due_amount()
        total_due += max(due, Decimal("0.00"))
        vendor_data.append({"vendor": vendor, "due": due})
    return render(request, "vendors/dashboard.html", {
        "vendor_data": vendor_data,
        "total_due": total_due,
    })
