from django.contrib import admin
from django.db.models import Sum, Count
from django.urls import path
from django.shortcuts import render
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models.functions import TruncMonth
from .models import LoanOfficer, Customer, LoanApplication, Address, Referee, LoanRepayment

# Admin Site Customization
admin.site.site_header = 'MFI Management System'
admin.site.site_title = 'MFI Admin Portal'
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
    list_display = ('street_name', 'ward', 'district', 'region', 'house_number')
    search_fields = ('street_name', 'ward', 'district', 'region', 'house_number')
    list_filter = ('region', 'district', 'ward')

@admin.register(LoanOfficer)
class LoanOfficerAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'middle_name', 'last_name', 'primary_phone', 'email', 'nida_number', 'get_total_collections')
    search_fields = ('first_name', 'middle_name', 'last_name', 'email', 'employee_id', 'nida_number', 'primary_phone')
    
    def get_total_collections(self, obj):
        return LoanRepayment.objects.filter(
            loan_application__loan_officer=obj
        ).aggregate(total=Sum('amount_paid'))['total'] or 0
    get_total_collections.short_description = 'Total Collections'
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('first_name', 'middle_name', 'last_name', 'nida_number', 'birth_date', 'email',
                      'primary_phone', 'secondary_phone', 'address'),
        }),
        ('Employment Details', {
            'fields': ('photo', 'identification_document'),
        }),
        ('Security', {
            'fields': ('password',),
        }),
    )

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'id_number', 'email', 'phone', 'loan_officer', 'created_at', 'get_total_loans')
    search_fields = ('full_name', 'id_number', 'email', 'phone')
    list_filter = ('loan_officer', 'is_active', 'created_at')
    
    def get_total_loans(self, obj):
        return LoanApplication.objects.filter(
            customer=obj, 
            status='APPROVED'
        ).aggregate(total=Sum('amount_approved'))['total'] or 0
    get_total_loans.short_description = 'Total Loans'
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('full_name', 'id_number', 'email', 'phone', 'alternative_phone', 'address', 'photo'),
        }),
        ('Financial Information', {
            'fields': ('occupation', 'monthly_income'),
        }),
        ('Relationship', {
            'fields': ('loan_officer', 'is_active'),
        }),
    )

@admin.register(Referee)
class RefereeAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'email', 'occupation', 'workplace')
    search_fields = ('full_name', 'phone', 'email', 'occupation')
    list_filter = ('created_at',)

@admin.register(LoanApplication)
class LoanApplicationAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'loan_officer', 'referee', 'amount_requested', 'status', 'created_at', 'get_repayment_status')
    list_filter = ('status', 'loan_officer', 'created_at')
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
            'fields': ('amount_requested', 'amount_approved', 'purpose', 'term_months', 'interest_rate'),
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
    list_filter = ('payment_date', 'payment_method', 'loan_application__loan_officer')
    search_fields = ('loan_application__customer__full_name',)
    date_hierarchy = 'payment_date'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(loan_application__loan_officer__user=request.user)