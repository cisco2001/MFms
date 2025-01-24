from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LoanOfficerViewSet, CustomerViewSet, LoanApplicationViewSet, admin_dashboard
from .views import CustomTokenObtainPairView  # Make sure this matches your view file
from rest_framework_simplejwt.views import TokenRefreshView

# Set up the router for ViewSets
router = DefaultRouter()
router.register(r'loan-officers', LoanOfficerViewSet, basename='loan-officer')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'loan-applications', LoanApplicationViewSet, basename='loan-application')

urlpatterns = [
    path('api/', include(router.urls)),  # Include API routes
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
   # path('dashboard/', admin_dashboard, name='admin-dashboard'),  # Admin dashboard
]