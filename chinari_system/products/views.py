from django.shortcuts import render, redirect, get_object_or_404
from .models import Product
from .forms import ProductForm

def products_list(request):
    products = Product.objects.all().order_by('name')
    return render(request, 'products/list.html', {
        'objects': products,
        'add_url': 'products_create',
        'delete_url': 'products_delete',
        'title': 'Products',
        'edit_url': 'products_edit',
    })

def products_create(request):
    if request.method == 'POST':
        form = ProductForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('products_list')
    else:
        form = ProductForm()
    return render(request, 'products/form.html', {'form': form, 'title': 'Add Product'})

def products_edit(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    if request.method == 'POST':
        form = ProductForm(request.POST, instance=product)
        if form.is_valid():
            form.save()
            return redirect('products_list')
    else:
        form = ProductForm(instance=product)
    return render(request, 'products/form.html', {'form': form, 'title': 'Edit Product'})

def products_delete(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    product.delete()
    return redirect('products_list')
