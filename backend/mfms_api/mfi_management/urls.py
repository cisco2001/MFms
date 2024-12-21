# mfms_api/mfi_management/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MicrofinanceViewSet

router = DefaultRouter()
router.register(r'microfinances', MicrofinanceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]