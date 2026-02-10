from django import forms
from .models import Sale


class SaleForm(forms.ModelForm):
    class Meta:
        model = Sale
        fields = ["vendor", "product", "quantity", "price_per_unit"]

        widgets = {
            "vendor": forms.Select(attrs={
                "class": "select select-bordered w-full text-lg"
            }),
            "product": forms.Select(attrs={
                "class": "select select-bordered w-full text-lg"
            }),
            "quantity": forms.NumberInput(attrs={
                "class": "input input-bordered w-full text-lg",
                "inputmode": "decimal",
                "step": "0.01",
                "placeholder": "Quantity"
            }),
            "price_per_unit": forms.NumberInput(attrs={
                "class": "input input-bordered w-full text-lg",
                "inputmode": "decimal",
                "step": "0.01",
                "placeholder": "Price per unit"
            }),
        }
