from django.db import models
from django_tenants.models import TenantMixin

class Microfinance(TenantMixin):
    name = models.CharField(max_length=100)
    created_on = models.DateField(auto_now_add=True)

    # You can add more fields as needed
    # For example, address, contact details, etc.

    def __str__(self):
        return self.name