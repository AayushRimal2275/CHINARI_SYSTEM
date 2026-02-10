from django import forms
from .models import Inventory

class InventoryForm(forms.ModelForm):
    class Meta:
        model = Inventory
        fields = ['product', 'quantity']
        widgets = {
            'product': forms.Select(attrs={'class': 'w-full p-2 border rounded'}),
            'quantity': forms.NumberInput(attrs={'class': 'w-full p-2 border rounded', 'step': '0.01'}),
        }
