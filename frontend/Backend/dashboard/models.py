from django.db import transaction
from django.db.models import Max, Sum
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from datetime import timedelta

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
    def create_user(self, email, employee_id, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        if not employee_id:
            raise ValueError("Employee ID is required")
            
        email = self.normalize_email(email)
        user = self.model(email=email, employee_id=employee_id, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, employee_id, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, employee_id, password, **extra_fields)


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

    employee_id = models.CharField(max_length=5, blank=True, unique=True)
    username = None
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)

    photo = models.ImageField(upload_to='loan_officers/photos/', null=True, blank=True)
    identification_document = models.FileField(
        upload_to='loan_officers/documents/',
        null=True,
        blank=True,
    )

    total_allocated = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)  # Total amount allocated

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

    USERNAME_FIELD = 'employee_id'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name', 'nida_number', 'primary_phone']

    objects = LoanOfficerManager()

    class Meta:
        verbose_name = 'Loan Officer'
        verbose_name_plural = 'Loan Officers'
    
    def get_available_balance(self):
        """Calculate remaining balance after loans and expenses"""
        total_loans = LoanApplication.objects.filter(
            loan_officer=self, status='APPROVED'
        ).aggregate(total=Sum('amount_approved'))['total'] or 0

        total_expenses = Expense.objects.filter(user=self).aggregate(total=Sum('amount'))['total'] or 0

        return self.total_allocated - (total_loans + total_expenses)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.employee_id} (Balance: {self.get_available_balance()})"


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
    ID_TYPE_CHOICES = [
        ('NIDA', 'National ID'),
        ('VOTER', 'Voter ID'),
        ('OTHER', 'Other'),
    ]

    full_name = models.CharField(max_length=100)
    id_type = models.CharField(max_length=10, choices=ID_TYPE_CHOICES, default='NIDA')
    id_number = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=15)
    alternative_phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True)
    profile_picture = models.ImageField(upload_to='customers/profile_pictures/', null=True, blank=True)
    id_photo = models.ImageField(upload_to='customers/id_photos/', null=True, blank=True)

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

    def clean(self):
        super().clean()
        if self.id_type == 'NIDA' and len(self.id_number) != 20:
            raise ValidationError(('National ID must be exactly 20 digits long.'))
        elif self.id_type == 'VOTER' and len(self.id_number) != 14:
            raise ValidationError(('Voter ID must be exactly 14 digits long.'))
        elif self.id_type == 'OTHER' and len(self.id_number) > 20:
            raise ValidationError(('Other ID types must be at most 20 characters long.'))

    class Meta:
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'


class Expense(models.Model):
    EXPENSE_TYPE_CHOICES = [
        ('personal', 'Personal'),
        ('institution', 'Institution'),
    ]
    
    user = models.ForeignKey(LoanOfficer, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    expense_type = models.CharField(max_length=20, choices=EXPENSE_TYPE_CHOICES, default='personal')
    description = models.TextField()
    date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        """Ensure expenses do not exceed available balance"""
        if self.user and self.amount > self.user.get_available_balance():
            raise ValidationError("Insufficient funds for this expense.")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Expense {self.id} - {self.user if self.user else 'Institution'}"



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

    COLLATERAL_TYPE_CHOICES = [
        ('vehicle', 'Vehicle'),
        ('land', 'Land'),
        ('house', 'House'),
        ('equipment', 'Equipment'),
        ('other', 'Other'),
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
    interest = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)  # New Field
    purpose = models.TextField()
    term_months = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    approved_by = models.ForeignKey(
        LoanOfficer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_applications'
    )
    rejection_reason = models.TextField(blank=True, null=True)

    # Collateral fields
    collateral_type = models.CharField(max_length=20, choices=COLLATERAL_TYPE_CHOICES, default='other')
    collateral_description = models.TextField(blank=True, null=True)
    collateral_photo = models.ImageField(upload_to='collaterals/photos/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_date = models.DateTimeField(null=True, blank=True)

    def get_due_date(self):
        """Calculate the due date based on approved date and loan term."""
        if self.approved_date and self.term_months:
            return self.approved_date + timedelta(days=self.term_months * 30)  # Approximate month as 30 days
        return None
    
    def __str__(self):
        return f"Loan #{self.id} - {self.customer.full_name} - {self.collateral_type}"

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

class Allocation(models.Model):
    loan_officer = models.ForeignKey(LoanOfficer, on_delete=models.CASCADE, related_name="allocations")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    allocated_by = models.ForeignKey(LoanOfficer, on_delete=models.SET_NULL, null=True, blank=True, related_name="allocated_funds")
    date_allocated = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        """Automatically update Loan Officer's total allocated amount when a new allocation is made"""
        super().save(*args, **kwargs)
        self.loan_officer.total_allocated += self.amount
        self.loan_officer.save()

    def __str__(self):
        return f"{self.amount} allocated to {self.loan_officer} on {self.date_allocated}"

class DailyReport(models.Model):
    loan_officer = models.ForeignKey(LoanOfficer, on_delete=models.CASCADE, related_name="daily_reports")
    report_date = models.DateField(default=timezone.now)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('loan_officer', 'report_date')  # Prevent duplicate reports for the same day

    def __str__(self):
        return f"Report of {self.loan_officer} - {self.report_date}"

    def get_total_collections(self):
        return LoanRepayment.objects.filter(
            loan_application__loan_officer=self.loan_officer,
            payment_date=self.report_date
        ).aggregate(total=Sum('amount_paid'))['total'] or 0.00

    def get_total_new_loans(self):
        return LoanApplication.objects.filter(
            loan_officer=self.loan_officer,
            status='APPROVED',
            created_at__date=self.report_date
        ).aggregate(total=Sum('amount_approved'))['total'] or 0.00

    def get_total_expenses(self):
        return Expense.objects.filter(
            user=self.loan_officer,
            date=self.report_date
        ).aggregate(total=Sum('amount'))['total'] or 0.00

    def get_remaining_balance(self):
        return self.loan_officer.get_available_balance()
