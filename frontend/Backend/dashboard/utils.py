from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from django.http import HttpResponse
from decimal import Decimal
from .models import LoanRepayment, LoanApplication, Expense

def format_amount(amount):
    """Helper function to format amount with Tsh"""
    return f"Tsh {amount:,.2f}"

def generate_pdf_report(loan_officer, report_date):
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Daily_Report_{loan_officer.first_name}_{report_date}.pdf"'

    # Create PDF
    buffer = response
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []

    styles = getSampleStyleSheet()
    title_style = styles['Title']
    heading_style = styles['Heading2']
    normal_style = styles['BodyText']

    # Logo and basic info remain the same
    logo_path = "static/images/company_logo.png"
    logo = Image(logo_path, width=80, height=50)
    elements.append(logo)
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("Daily Loan Officer Report", title_style))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Date: {report_date}", normal_style))
    elements.append(Paragraph(f"Loan Officer: {loan_officer.first_name} {loan_officer.last_name}", normal_style))
    elements.append(Spacer(1, 12))

    current_balance = Decimal(str(loan_officer.get_available_balance()))
    elements.append(Spacer(1, 12))

    # Loans Disbursed
    loans = LoanApplication.objects.filter(loan_officer=loan_officer, created_at__date=report_date, status='APPROVED')
    loans_data = [["Customer Name", "Amount Approved"]]
    total_loans = Decimal('0.00')
    for loan in loans:
        loans_data.append([loan.customer.full_name, format_amount(loan.amount_approved)])
        total_loans += loan.amount_approved
    if total_loans > 0:
        loans_data.append(["Total", format_amount(total_loans)])

    if len(loans_data) > 1:
        loans_table = Table(loans_data, colWidths=[320, 100])
        loans_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(Paragraph("Loans Disbursed:", heading_style))
        elements.append(loans_table)
        elements.append(Spacer(1, 12))
    else:
        elements.append(Paragraph("No loans disbursed today.", normal_style))
        elements.append(Spacer(1, 12))

    # Expenses
    expenses = Expense.objects.filter(user=loan_officer, date=report_date)
    expenses_data = [["Description", "Amount"]]
    total_expenses = Decimal('0.00')
    for expense in expenses:
        expenses_data.append([expense.description, format_amount(expense.amount)])
        total_expenses += expense.amount
    if total_expenses > 0:
        expenses_data.append(["Total", format_amount(total_expenses)])

    if len(expenses_data) > 1:
        expenses_table = Table(expenses_data, colWidths=[320, 100])
        expenses_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(Paragraph("Expenses Incurred:", heading_style))
        elements.append(expenses_table)
        elements.append(Spacer(1, 12))
    else:
        elements.append(Paragraph("No expenses recorded today.", normal_style))
        elements.append(Spacer(1, 12))

    # Collections
    collections = LoanRepayment.objects.filter(loan_application__loan_officer=loan_officer, payment_date=report_date)
    collections_data = [["Customer Name", "Amount Paid"]]
    total_collections = Decimal('0.00')
    for collection in collections:
        collections_data.append([collection.loan_application.customer.full_name, format_amount(collection.amount_paid)])
        total_collections += collection.amount_paid
    if total_collections > 0:
        collections_data.append(["Total", format_amount(total_collections)])

    if len(collections_data) > 1:
        collections_table = Table(collections_data, colWidths=[320, 100])
        collections_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(Paragraph("Collections Received:", heading_style))
        elements.append(collections_table)
        elements.append(Spacer(1, 12))
    else:
        elements.append(Paragraph("No collections received today.", normal_style))
        elements.append(Spacer(1, 12))

    # Summary with formatted amounts
    elements.append(Paragraph(f"Total Collections: {format_amount(total_collections)}", normal_style))
    elements.append(Paragraph(f"Total Expenses: {format_amount(total_expenses)}", normal_style))
    elements.append(Paragraph(f"Total Loans Disbursed: {format_amount(total_loans)}", normal_style))
    elements.append(Spacer(1, 12))

    # Final Balance
    final_balance = current_balance + total_collections
    elements.append(Paragraph(f"Final Balance: {format_amount(final_balance)}", heading_style))

    doc.build(elements)
    return response