from django import forms
from .models import Payment

class PaymentForm(forms.ModelForm):
    class Meta:
        model = Payment
        fields = ['vendor', 'sale', 'amount', 'notes']
        widgets = {
            'vendor': forms.Select(attrs={'class': 'w-full p-2 border rounded'}),
            'sale': forms.Select(attrs={'class': 'w-full p-2 border rounded'}),
            'amount': forms.NumberInput(attrs={'class': 'w-full p-2 border rounded', 'step': '0.01'}),
            'notes': forms.Textarea(attrs={'class': 'w-full p-2 border rounded', 'rows': 3}),
        }
