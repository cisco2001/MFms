from rest_framework import serializers
from .models import LoanOfficer, Customer, LoanApplication

class LoanOfficerSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = LoanOfficer
        fields = ['id', 'email', 'employee_id', 'password', 'first_name', 'last_name', 
                 'nida_number', 'primary_phone', 'is_active', 'is_staff']
        read_only_fields = ['employee_id']  # Make employee_id read-only as it's auto-generated

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = super().create(validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class LoanApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanApplication
        fields = '__all__'
        read_only_fields = ('status', 'approved_by')
