from django.shortcuts import render, get_object_or_404,redirect
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import Vendor
from sales.models import Sale
from payments.models import Payment

def home(request):
    return redirect("/admin/")
def vendor_statement(request, vendor_id):
    vendor = get_object_or_404(Vendor, id=vendor_id)

    # days filter (?days=30)
    days = int(request.GET.get("days", 30))
    start_date = timezone.now() - timedelta(days=days)

    sales = Sale.objects.filter(
        vendor=vendor,
        created_at__gte=start_date
    ).order_by("created_at")

    payments = Payment.objects.filter(
        vendor=vendor,
        payment_date__gte=start_date
    ).order_by("payment_date")

    total_sales = sum(s.total_amount for s in sales)
    total_payments = sum(p.amount for p in payments)
    closing_due = total_sales - total_payments

    context = {
        "vendor": vendor,
        "sales": sales,
        "payments": payments,
        "days": days,
        "total_sales": total_sales,
        "total_payments": total_payments,
        "closing_due": closing_due,
    }

    return render(request, "vendors/statement.html", context)


def dashboard(request):
    vendors = Vendor.objects.all()

    vendor_data = []
    total_due = Decimal("0.00")

    for vendor in vendors:
        due = vendor.total_due_amount()
        total_due += max(due, Decimal("0.00"))

        vendor_data.append({
            "vendor": vendor,
            "due": due,
        })

    context = {
        "vendor_data": vendor_data,
        "total_due": total_due,
    }

    return render(request, "vendors/dashboard.html", context)
