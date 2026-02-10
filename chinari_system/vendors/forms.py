from django import forms
from .models import Vendor

class VendorForm(forms.ModelForm):
    class Meta:
        model = Vendor
        fields = ['name', 'phone', 'address']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'w-full p-2 border rounded'}),
            'phone': forms.TextInput(attrs={'class': 'w-full p-2 border rounded'}),
            'address': forms.Textarea(attrs={'class': 'w-full p-2 border rounded', 'rows': 3}),
        }
