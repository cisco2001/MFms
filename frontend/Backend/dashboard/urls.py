from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoanOfficerViewSet, 
    CustomerViewSet, 
    LoanApplicationViewSet, 
    admin_dashboard,
    CustomTokenObtainPairView
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'loan-officers', LoanOfficerViewSet, basename='loan-officer')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'loan-applications', LoanApplicationViewSet, basename='loan-application')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]