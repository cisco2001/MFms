from rest_framework import serializers
from .models import LoanOfficer, Customer, LoanApplication

class LoanOfficerSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanOfficer
        fields = '__all__'

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class LoanApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanApplication
        fields = '__all__'
        read_only_fields = ('status', 'approved_by')
