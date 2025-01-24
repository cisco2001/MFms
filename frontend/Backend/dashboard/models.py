from django.db import transaction
from django.db.models import Max
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from django.db.models.signals import pre_save
from django.dispatch import receiver


class Address(models.Model):
    region = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    ward = models.CharField(max_length=100)
    street_name = models.CharField(max_length=100)
    house_number = models.CharField(max_length=20, blank=True, null=True)
    additional_details = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.street_name}, {self.ward}, {self.district}, {self.region}"

    class Meta:
        verbose_name_plural = "Addresses"


class LoanOfficerManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
            
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class LoanOfficer(AbstractUser):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50)
    nida_number = models.CharField(max_length=20, unique=True)
    birth_date = models.DateField(null=True)

    primary_phone = models.CharField(max_length=15)
    secondary_phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True)

    employee_id = models.CharField(max_length=50, unique=True, blank=True)
    username = models.CharField(max_length=50, unique=True, blank=True)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    photo = models.ImageField(upload_to='loan_officers/photos/', null=True, blank=True)
    identification_document = models.FileField(
        upload_to='loan_officers/documents/',
        null=True,
        blank=True,
    )

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='loan_officer_set',
        blank=True,
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='loan_officer_permissions',
        blank=True,
        verbose_name='user permissions',
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'nida_number', 'primary_phone']

    objects = LoanOfficerManager()

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.employee_id}"


@receiver(pre_save, sender=LoanOfficer)
def generate_employee_id(sender, instance, **kwargs):
    if not instance.employee_id:
        with transaction.atomic():
            # Lock the table to prevent concurrent access
            last_number = LoanOfficer.objects.aggregate(
                max_num=Max(
                    models.functions.Cast(
                        models.functions.Substr('employee_id', 3),
                        models.IntegerField()
                    )
                )
            )['max_num'] or 0
            
            new_number = last_number + 1
            new_employee_id = f'RT{new_number:03d}'
            
            # Verify the generated ID is unique
            while LoanOfficer.objects.filter(employee_id=new_employee_id).exists():
                new_number += 1
                new_employee_id = f'RT{new_number:03d}'
            
            instance.employee_id = new_employee_id
            instance.username = new_employee_id


class Customer(models.Model):
    full_name = models.CharField(max_length=100)
    id_number = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=15)
    alternative_phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True)
    photo = models.ImageField(upload_to='customers/photos/', null=True, blank=True)

    occupation = models.CharField(max_length=100, blank=True, null=True)
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)

    loan_officer = models.ForeignKey(
        LoanOfficer,
        on_delete=models.SET_NULL,
        null=True,
        related_name='customers'
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} - {self.id_number}"


class Referee(models.Model):
    """
    Referee is now linked directly to the loan application instead of the customer,
    as different loans might have different referees
    """
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)  # Removed unique=True as referees might be reused
    email = models.EmailField(blank=True, null=True)
    relationship_to_customer = models.CharField(max_length=50)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True)
    photo = models.ImageField(upload_to='referees/photos/', null=True, blank=True)

    occupation = models.CharField(max_length=100, blank=True, null=True)
    workplace = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.full_name


class LoanApplication(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING', 'Pending'),
        ('UNDER_REVIEW', 'Under Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name='loan_applications'
    )
    loan_officer = models.ForeignKey(
        LoanOfficer,
        on_delete=models.CASCADE,
        related_name='handled_applications'
    )
    referee = models.ForeignKey(
        Referee,
        on_delete=models.SET_NULL,
        null=True,
        related_name='loan_applications'
    )

    amount_requested = models.DecimalField(max_digits=12, decimal_places=2)
    amount_approved = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    purpose = models.TextField()
    term_months = models.IntegerField()
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    approved_by = models.ForeignKey(
        LoanOfficer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_applications'
    )
    rejection_reason = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_date = models.DateTimeField(null=True, blank=True)
    def __str__(self):
        return f"Loan #{self.id} - {self.customer.full_name}"

    class Meta:
        ordering = ['-created_at']


class LoanRepayment(models.Model):
    loan_application = models.ForeignKey(
        LoanApplication,
        on_delete=models.CASCADE,
        related_name='repayments'
    )
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    receipt = models.ImageField(upload_to='repayments/receipts/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Repayment for Loan #{self.loan_application.id}"

    class Meta:
        ordering = ['-payment_date']