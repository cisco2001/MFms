from django.db import models
from django_tenants.models import TenantMixin

class Address(models.Model):
    """ Model to store address information
        if a microfinance has branches then this one will be used as HQ address
    """

    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.street}, {self.city}, {self.state}, {self.postal_code}, {self.country}"

class Microfinance(TenantMixin):
    """ Model to store microfinance information
    """
    class Status(models.TextChoices):
        ACTIVE = 'Active', 'Active'
        PENDING = 'Pending', 'Pending'
        SUSPENDED = 'Suspended', 'Suspended'
        INACTIVE = 'Inactive', 'Inactive'
        CLOSED = 'Closed', 'Closed'
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    registration_number = models.CharField(max_length=100)
    tax_id = models.CharField(max_length=100)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=15)
    date_established = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    address = models.ForeignKey(Address, on_delete=models.CASCADE)
    logo_url = models.URLField()

    # KYC fields
    kyc_document_type = models.CharField(max_length=50)
    kyc_document_number = models.CharField(max_length=100)
    kyc_document_expiry_date = models.DateField(null=True, blank=True)
    kyc_verification_status = models.BooleanField(default=False)
    kyc_verification_date = models.DateField(null=True, blank=True)
    kyc_document_file = models.FileField(upload_to='kyc_documents/', null=True, blank=True)

    def __str__(self):
        return self.microfinance_name

    def __str__(self):
        return self.microfinance_name