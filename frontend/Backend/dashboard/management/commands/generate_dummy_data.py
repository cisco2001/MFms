# management/commands/generate_dummy_data.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from django.db import transaction
from datetime import datetime, timedelta
import random
from faker import Faker
from decimal import Decimal

from dashboard.models import (
    Address, LoanOfficer, Customer, Referee,
    LoanApplication, LoanRepayment
)

fake = Faker()

class Command(BaseCommand):
    help = 'Generates dummy data for the loan management system'

    def add_arguments(self, parser):
        parser.add_argument('--officers', type=int, default=5, help='Number of loan officers')
        parser.add_argument('--customers', type=int, default=20, help='Number of customers')
        parser.add_argument('--applications', type=int, default=30, help='Number of loan applications')

    def generate_address(self):
        regions = ['Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Mbeya']
        districts = ['Ilala', 'Kinondoni', 'Temeke', 'Ubungo', 'Kigamboni']
        wards = ['Upanga', 'Kariakoo', 'Magomeni', 'Msasani', 'Mikocheni']
        
        return Address.objects.create(
            region=random.choice(regions),
            district=random.choice(districts),
            ward=random.choice(wards),
            street_name=fake.street_name(),
            house_number=str(random.randint(1, 999)),
            additional_details=fake.sentence() if random.random() > 0.5 else None
        )

    def generate_loan_officers(self, count):
        officers = []
        for _ in range(count):
            address = self.generate_address()
            
            officer = LoanOfficer.objects.create(
                email=fake.email(),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                middle_name=fake.first_name() if random.random() > 0.5 else None,
                nida_number=f"NIDA{fake.unique.random_number(digits=8)}",
                birth_date=fake.date_of_birth(minimum_age=25, maximum_age=55),
                primary_phone=f"+255{fake.msisdn()[4:]}",
                secondary_phone=f"+255{fake.msisdn()[4:]}" if random.random() > 0.5 else None,
                address=address,
                password=make_password('password123'),
                is_staff=True
            )
            officers.append(officer)
        
        return LoanOfficer.objects.all()

    def generate_customers(self, count, officers):
        customers = []
        for _ in range(count):
            address = self.generate_address()
            
            customer = Customer(
                full_name=fake.name(),
                id_number=f"ID{fake.unique.random_number(digits=8)}",
                email=fake.email() if random.random() > 0.3 else None,
                phone=f"+255{fake.msisdn()[4:]}",
                alternative_phone=f"+255{fake.msisdn()[4:]}" if random.random() > 0.5 else None,
                address=address,
                occupation=fake.job(),
                monthly_income=Decimal(random.randint(300000, 5000000)),
                loan_officer=random.choice(officers)
            )
            customers.append(customer)
        
        Customer.objects.bulk_create(customers)
        return Customer.objects.all()

    def generate_referees(self, count):
        referees = []
        for _ in range(count):
            address = self.generate_address()
            
            referee = Referee(
                full_name=fake.name(),
                phone=f"+255{fake.msisdn()[4:]}",
                email=fake.email() if random.random() > 0.3 else None,
                relationship_to_customer=random.choice(['Friend', 'Colleague', 'Relative', 'Neighbor']),
                address=address,
                occupation=fake.job(),
                workplace=fake.company()
            )
            referees.append(referee)
        
        Referee.objects.bulk_create(referees)
        return Referee.objects.all()

    def generate_loan_applications(self, count, customers, officers, referees):
        applications = []
        statuses = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED']
        weights = [0.2, 0.2, 0.4, 0.15, 0.05]  # More approved loans for better data distribution
        
        for _ in range(count):
            status = random.choices(statuses, weights=weights)[0]
            amount_requested = Decimal(random.randint(500000, 10000000))
            
            application = LoanApplication(
                customer=random.choice(customers),
                loan_officer=random.choice(officers),
                referee=random.choice(referees),
                amount_requested=amount_requested,
                amount_approved=amount_requested * Decimal(random.uniform(0.8, 1.0)) if status == 'APPROVED' else None,
                purpose=fake.paragraph(),
                term_months=random.choice([3, 6, 12, 24]),
                interest_rate=Decimal(random.uniform(10, 25)),
                status=status,
                approved_by=random.choice(officers) if status == 'APPROVED' else None,
                rejection_reason=fake.paragraph() if status == 'REJECTED' else None,
                created_at=fake.date_time_between(start_date='-1y', end_date='now', tzinfo=timezone.get_current_timezone())
            )
            applications.append(application)
        
        LoanApplication.objects.bulk_create(applications)
        return LoanApplication.objects.all()

    def generate_repayments(self, applications):
        repayments = []
        payment_methods = ['Mobile Money', 'Bank Transfer', 'Cash', 'Cheque']
        
        for application in applications:
            if application.status == 'APPROVED':
                # Generate between 1 and 12 repayments for each approved loan
                num_repayments = random.randint(1, 12)
                total_amount = application.amount_approved
                monthly_payment = total_amount / application.term_months
                
                for i in range(num_repayments):
                    payment_date = application.created_at.date() + timedelta(days=30 * (i + 1))
                    
                    repayment = LoanRepayment(
                        loan_application=application,
                        amount_paid=monthly_payment,
                        payment_date=payment_date,
                        payment_method=random.choice(payment_methods)
                    )
                    repayments.append(repayment)
        
        LoanRepayment.objects.bulk_create(repayments)

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('Generating dummy data...')
        
        # Clear existing data
        LoanRepayment.objects.all().delete()
        LoanApplication.objects.all().delete()
        Referee.objects.all().delete()
        Customer.objects.all().delete()
        LoanOfficer.objects.all().delete()
        Address.objects.all().delete()
        
        # Generate new data
        officers = self.generate_loan_officers(options['officers'])
        self.stdout.write(f'Created {len(officers)} loan officers')
        
        customers = self.generate_customers(options['customers'], officers)
        self.stdout.write(f'Created {len(customers)} customers')
        
        referees = self.generate_referees(options['customers'])  # One referee per customer
        self.stdout.write(f'Created {len(referees)} referees')
        
        applications = self.generate_loan_applications(
            options['applications'],
            customers,
            officers,
            referees
        )
        self.stdout.write(f'Created {len(applications)} loan applications')
        
        self.generate_repayments(applications)
        self.stdout.write(f'Created repayments for approved loans')
        
        self.stdout.write(self.style.SUCCESS('Successfully generated dummy data'))