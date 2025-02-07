from django.contrib import admin
from django.contrib.auth.models import User, Group
from django.db.models import Sum, Count
from django.urls import path
from django.shortcuts import render
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models.functions import TruncMonth
from .models import LoanOfficer, Customer, LoanApplication, Address, Referee, LoanRepayment, Expense, Allocation, DailyReport
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.utils.timezone import now
from django.http import HttpResponseRedirect
from .models import DailyReport
from .utils import generate_pdf_report
from django.utils.html import format_html
from django.urls import reverse
from django.db import models

# Unregister the default User and Group models
admin.site.unregister(Group)

# remove filter in django admin

# Admin Site Customization
admin.site.site_header = 'RETAWA Loans Management System'
admin.site.site_title = 'RETAWA Admin Portal'
admin.site.index_title = 'Welcome to MFI Management System'

class CustomAdminSite(admin.AdminSite):
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('dashboard/', self.admin_view(self.dashboard_view), name='dashboard'),
        ]
        return custom_urls + urls

    def dashboard_view(self, request):
        # Time periods for filtering
        today = timezone.now().date()
        last_30_days = today - timedelta(days=30)
        
        context = {
            # Summary Statistics
            'total_customers': Customer.objects.count(),
            'active_loans': LoanApplication.objects.filter(status='APPROVED').count(),
            'total_loan_officers': LoanOfficer.objects.count(),
            
            # Financial Metrics
            'total_disbursed': LoanApplication.objects.filter(
                status='APPROVED'
            ).aggregate(total=Sum('amount_approved'))['total'] or 0,
            
            'collections_30_days': LoanRepayment.objects.filter(
                payment_date__gte=last_30_days
            ).aggregate(total=Sum('amount_paid'))['total'] or 0,
            
            # Per Loan Officer Statistics
            'officer_stats': LoanOfficer.objects.annotate(
                total_customers=Count('customer'),
                total_collections=Sum('loanapplication__loanrepayment__amount_paid'),
                active_loans=Count('loanapplication', filter={'status': 'APPROVED'})
            ),
            
            # Monthly Collections
            'monthly_collections': LoanRepayment.objects.annotate(
                month=TruncMonth('payment_date')
            ).values('month').annotate(
                total=Sum('amount_paid')
            ).order_by('-month')[:12],
        }
        
        return render(request, 'admin/dashboard.html', context)
@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    def get_model_perms(self, request):
        """Hide from sidebar by returning empty permissions."""
        return {}

# Allow Address to be managed within Customer and Loan Applications
class AddressInline(admin.StackedInline):  # or TabularInline
    model = Address
    extra = 1  # Allow adding new addresses

@admin.register(Referee)
class RefereeAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'relationship_to_customer', 'address')


@admin.register(LoanOfficer)
class LoanOfficerAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'middle_name', 'last_name', 'primary_phone', 'email', 'nida_number', 'get_total_collections', 'get_available_balance')
    search_fields = ('first_name', 'middle_name', 'last_name', 'email', 'employee_id', 'nida_number', 'primary_phone')
    def save_model(self, request, obj, form, change):
        if not change:  # If this is a new object (not an update)
            obj.set_password(obj.password)  # Hash the password before saving
        elif 'password' in form.changed_data:  # If password was changed during update
            obj.set_password(obj.password)  # Hash the new password
        super().save_model(request, obj, form, change)   
    def get_total_collections(self, obj):
        return LoanRepayment.objects.filter(
            loan_application__loan_officer=obj
        ).aggregate(total=Sum('amount_paid'))['total'] or 0
    get_total_collections.short_description = 'Total Collections'
    
    def get_available_balance(self, obj):
        return obj.get_available_balance()
    get_available_balance.short_description = "Available Balance"

    fieldsets = (
        ('Personal Information', {
            'fields': ('first_name', 'middle_name', 'last_name', 'nida_number', 'birth_date', 'email',
                      'primary_phone', 'secondary_phone', 'address'),
        }),
        ('Employment Details', {
            'fields': ('photo', 'identification_document'),
        }),
        ('Security', {
            'fields': ('password', 'is_active', 'is_staff'),
        }),
    )

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'loan_officer', 'created_at', 'get_total_borrowed', 'get_expected_repayment', 'get_due_date')
    search_fields = ('full_name', 'phone')
    list_filter = ['id_type', 'is_active']

    def get_total_borrowed(self, obj):
        """Returns the total amount approved for the customer."""
        return LoanApplication.objects.filter(
            customer=obj, 
            status='APPROVED'
        ).aggregate(total=Sum('amount_approved'))['total'] or 0
    get_total_borrowed.short_description = 'Total Borrowed'

    def get_expected_repayment(self, obj):
        """Returns the total amount the customer is expected to repay (borrowed + agreed extra)."""
        return LoanApplication.objects.filter(
            customer=obj, 
            status='APPROVED'
        ).aggregate(total=Sum(models.F('amount_approved') + models.F('interest')))['total'] or 0
    get_expected_repayment.short_description = 'Expected Repayment'

    def get_due_date(self, obj):
        """Returns the latest due date of all the customer's loans."""
        latest_due_date = LoanApplication.objects.filter(
            customer=obj, status='APPROVED'
        ).order_by('-approved_date').first()

        return latest_due_date.get_due_date() if latest_due_date else "N/A"
    get_due_date.short_description = 'Due Date'

    fieldsets = (
        ('Personal Information', {
            'fields': ('full_name', 'profile_picture', 'id_photo'),
        }),
        ('Contact Information', {
            'fields': ('phone', 'alternative_phone', 'address',),
        }),
        ('Financial Information', {
            'fields': ('occupation', 'monthly_income'),
        }),
        ('Relationship', {
            'fields': ('loan_officer', 'is_active'),
        }),
    )

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)


@admin.register(LoanApplication)
class LoanApplicationAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'customer', 'loan_officer', 'referee', 
        'amount_requested', 'status', 'collateral_type', 'created_at', 'get_repayment_status'
    )
    search_fields = ('customer__full_name', 'loan_officer__email', 'referee__full_name')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')

    def get_repayment_status(self, obj):
        total_paid = obj.repayments.aggregate(total=Sum('amount_paid'))['total'] or 0
        if obj.amount_approved:
            return f"{(total_paid / obj.amount_approved) * 100:.2f}%"
        return "0%"
    get_repayment_status.short_description = 'Repayment Progress'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('customer', 'loan_officer', 'referee'),
        }),
        ('Loan Details', {
            'fields': ('amount_requested', 'amount_approved', 'interest', 'purpose', 'term_months'),
        }),
        ('Collateral Information', {
            'fields': ('collateral_type', 'collateral_description', 'collateral_photo'),
        }),
        ('Status', {
            'fields': ('status', 'approved_by', 'rejection_reason'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
        }),
    )

    def save_model(self, request, obj, form, change):
        if obj.status == 'APPROVED' and not obj.approved_by:
            obj.approved_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(LoanRepayment)
class LoanRepaymentAdmin(admin.ModelAdmin):
    list_display = ('loan_application', 'amount_paid', 'payment_date', 'payment_method')
    list_filter = []
    search_fields = ('loan_application__customer__full_name',)
    date_hierarchy = 'payment_date'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(loan_application__loan_officer__user=request.user)

# register expenses
@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('description', 'amount', 'date', 'created_at')
    list_filter = []
    search_fields = ('description',)
    date_hierarchy = 'date'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(loan_officer__user=request.user)

@admin.register(Allocation)
class AllocationAdmin(admin.ModelAdmin):
    list_display = ('loan_officer', 'amount', 'allocated_by', 'date_allocated')
    search_fields = ('loan_officer__first_name', 'loan_officer__last_name')
    date_hierarchy = 'date_allocated'

@admin.register(DailyReport)
class DailyReportAdmin(admin.ModelAdmin):
    list_display = ('loan_officer', 'report_date', 'total_collections', 'total_new_loans', 'total_expenses', 'remaining_balance', 'download_pdf')
    search_fields = ('loan_officer__first_name', 'loan_officer__last_name')
    date_hierarchy = 'report_date'
    list_filter = ('loan_officer', 'report_date')

    def total_collections(self, obj):
        return obj.get_total_collections()
    total_collections.short_description = "Total Collections"

    def total_new_loans(self, obj):
        return obj.get_total_new_loans()
    total_new_loans.short_description = "Total New Loans"

    def total_expenses(self, obj):
        return obj.get_total_expenses()
    total_expenses.short_description = "Total Expenses"

    def remaining_balance(self, obj):
        return obj.get_remaining_balance()
    remaining_balance.short_description = "Remaining Balance"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('generate-pdf/<int:report_id>/', self.admin_site.admin_view(self.generate_pdf), name='generate_pdf'),
        ]
        return custom_urls + urls

    def generate_pdf(self, request, report_id):
        report = get_object_or_404(DailyReport, id=report_id)
        return generate_pdf_report(report.loan_officer, report.report_date)

    def download_pdf(self, obj):
        """
        Creates a clickable link instead of returning a redirect response.
        """
        pdf_url = reverse('admin:generate_pdf', args=[obj.id])
        return format_html('<a href="{}" target="_blank">Download PDF</a>', pdf_url)
    
    download_pdf.short_description = "Download PDF"