from django.shortcuts import render, redirect, get_object_or_404
from .models import Payment
from .forms import PaymentForm
from django.utils import timezone
from datetime import timedelta

def payments_list(request):
    days = int(request.GET.get('days', 30))
    start_date = timezone.now() - timedelta(days=days)
    payments = Payment.objects.filter(payment_date__gte=start_date).order_by('-payment_date')
    return render(request, 'payments/list.html', {
        'objects': payments,
        'days': days,
        'add_url': 'payments_create',
        'delete_url': 'payments_delete',
        'title': 'Payments',
        'edit_url': None,
    })

def payments_create(request):
    if request.method == 'POST':
        form = PaymentForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('payments_list')
    else:
        form = PaymentForm()
    return render(request, 'payments/form.html', {'form': form, 'title': 'Add Payment'})

def payments_delete(request, payment_id):
    payment = get_object_or_404(Payment, id=payment_id)
    payment.delete()
    return redirect('payments_list')
