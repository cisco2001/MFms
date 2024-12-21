# mfms_api/mfi_management/serializers.py
from rest_framework import serializers
from .models import Microfinance

class MicrofinanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Microfinance
        fields = '__all__'