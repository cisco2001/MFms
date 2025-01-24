from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from .models import LoanApplication, Customer

class DashboardService:
    @staticmethod
    def get_dashboard_stats():
        today = timezone.now()
        thirty_days_ago = today - timedelta(days=30)
        
        return {
            'total_loans': LoanApplication.objects.count(),
            'pending_loans': LoanApplication.objects.filter(status='PENDING').count(),
            'approved_loans': LoanApplication.objects.filter(status='APPROVED').count(),
            'total_customers': Customer.objects.count(),
            'monthly_stats': {
                'new_loans': LoanApplication.objects.filter(
                    created_at__gte=thirty_days_ago
                ).count(),
                'new_customers': Customer.objects.filter(
                    created_at__gte=thirty_days_ago
                ).count(),
                'approved_amount': LoanApplication.objects.filter(
                    status='APPROVED',
                    created_at__gte=thirty_days_ago
                ).aggregate(total=Sum('amount'))['total'] or 0,
            }
        }