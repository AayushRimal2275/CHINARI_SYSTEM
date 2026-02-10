from django import forms
from .models import Product

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ['name', 'unit', 'price_per_unit']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'w-full p-2 border rounded'}),
            'unit': forms.TextInput(attrs={'class': 'w-full p-2 border rounded'}),
            'price_per_unit': forms.NumberInput(attrs={'class': 'w-full p-2 border rounded', 'step': '0.01'}),
        }
