from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .serializers import LoanOfficerSerializer, CustomerSerializer, LoanApplicationSerializer
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import render
from django.db.models import Count, Sum, Q
from django.contrib.admin.views.decorators import staff_member_required
from django.utils import timezone
from datetime import timedelta
from .models import LoanOfficer, Customer, LoanApplication

# Keep your existing ViewSets
class LoanOfficerViewSet(viewsets.ModelViewSet):
    queryset = LoanOfficer.objects.all()
    serializer_class = LoanOfficerSerializer
    permission_classes = [permissions.IsAdminUser]

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Customer.objects.all()
        return Customer.objects.filter(loan_officer__user=self.request.user)

class LoanApplicationViewSet(viewsets.ModelViewSet):
    queryset = LoanApplication.objects.all()
    serializer_class = LoanApplicationSerializer
    
    @action(detail=True, methods=['post'])
    def approve_loan(self, request, pk=None):
        loan = self.get_object()
        if not request.user.is_staff:
            return Response(
                {"error": "Only managers can approve loans"},
                status=status.HTTP_403_FORBIDDEN
            )
        loan.status = 'APPROVED'
        loan.approved_by = request.user
        loan.save()
        return Response({"status": "loan approved"})
    
    @action(detail=True, methods=['post'])
    def reject_loan(self, request, pk=None):
        loan = self.get_object()
        if not request.user.is_staff:
            return Response(
                {"error": "Only managers can reject loans"},
                status=status.HTTP_403_FORBIDDEN
            )
        loan.status = 'REJECTED'
        loan.approved_by = request.user
        loan.save()
        return Response({"status": "loan rejected"})
        
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer to use email instead of username
    """
    username_field = 'email'

    def validate(self, attrs):
        # Authenticate using email and password
        authenticate_kwargs = {
            'email': attrs.get('email'),
            'password': attrs.get('password')
        }
        try:
            user = LoanOfficer.objects.get(email=authenticate_kwargs['email'])
            if user.check_password(authenticate_kwargs['password']):
                refresh = self.get_token(user)
                data = {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user_id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'employee_id': user.employee_id
                }
                return data
            else:
                raise serializers.ValidationError('Invalid credentials')
        except LoanOfficer.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials')

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token obtain view using the custom serializer
    """
    serializer_class = CustomTokenObtainPairSerializer


@staff_member_required
def admin_dashboard(request):
    today = timezone.now()
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    last_6_months = []
    monthly_collections = []
    
    for i in range(6):
        month = today - timedelta(days=30 * i)
        month_start = month.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
        
        month_collections = LoanApplication.objects.filter(
            status='APPROVED',
            approved_date__range=(month_start, month_end)
        ).aggregate(total=Sum('amount_approved'))['total'] or 0
        
        last_6_months.insert(0, month.strftime('%B %Y'))
        monthly_collections.insert(0, float(month_collections))

    context = {
    'total_customers': Customer.objects.count(),
    'active_loans': LoanApplication.objects.filter(status='APPROVED').count(),
    'total_disbursed': LoanApplication.objects.filter(
        status='APPROVED'
    ).aggregate(total=Sum('amount_approved'))['total'] or 0,
    'collections_30_days': LoanApplication.objects.filter(
        status='APPROVED',
        approved_date__gte=today - timedelta(days=30)
    ).aggregate(total=Sum('amount_approved'))['total'] or 0,
    'total_loans': LoanApplication.objects.count(),  # Added
    'pending_approvals': LoanApplication.objects.filter(status='PENDING').count(),  # Added
    'officer_stats': LoanOfficer.objects.annotate(
        total_customers=Count('customers'),
        active_loans=Count(
            'handled_applications',
            filter=Q(handled_applications__status='APPROVED')
        ),
        total_collections=Sum(
            'handled_applications__amount_approved',
            filter=Q(handled_applications__status='APPROVED')
        )
    ),
    'monthly_collections_labels': last_6_months,
    'monthly_collections_values': monthly_collections,
    }
        
    return render(request, 'admin/dashboard.html', context)