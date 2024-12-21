# mfms_api/mfi_management/views.py
from rest_framework import viewsets
from .models import Microfinance
from .serializers import MicrofinanceSerializer

class MicrofinanceViewSet(viewsets.ModelViewSet):
    queryset = Microfinance.objects.all()
    serializer_class = MicrofinanceSerializer