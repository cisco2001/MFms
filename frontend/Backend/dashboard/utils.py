from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from django.http import HttpResponse
from datetime import timedelta
from django.utils.timezone import now
from django.db.models import Sum
from decimal import Decimal
from .models import LoanRepayment, LoanApplication, Expense, DailyReport

def generate_pdf_report(loan_officer, report_date):
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Daily_Report_{loan_officer.first_name}_{report_date}.pdf"'

    # Create PDF
    buffer = response
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []

    # Styles
    styles = getSampleStyleSheet()
    title_style = styles['Title']
    heading_style = styles['Heading2']
    normal_style = styles['BodyText']

    # Title
    elements.append(Paragraph("Daily Loan Officer Report", title_style))
    elements.append(Spacer(1, 12))

    # Loan Officer & Date Info
    elements.append(Paragraph(f"Date: {report_date}", normal_style))
    elements.append(Paragraph(f"Loan Officer: {loan_officer.first_name} {loan_officer.last_name}", normal_style))
    elements.append(Spacer(1, 12))

    # Current Balance
    current_balance = Decimal(str(loan_officer.get_available_balance()))
    elements.append(Paragraph(f"Current Balance: {current_balance:.2f}", normal_style))
    elements.append(Spacer(1, 12))

    # Loans Disbursed
    loans = LoanApplication.objects.filter(loan_officer=loan_officer, created_at__date=report_date, status='APPROVED')
    loans_data = [["Customer Name", "Amount Approved"]]
    total_loans = Decimal('0.00')
    for loan in loans:
        loans_data.append([loan.customer.full_name, f"{loan.amount_approved:.2f}"])
        total_loans += loan.amount_approved
    if total_loans > 0:
        loans_data.append(["Total", f"{total_loans:.2f}"])

    if len(loans_data) > 1:
        loans_table = Table(loans_data)
        loans_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'LEFT'),  # Header left alignment
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),  # Amount column right alignment
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),  # Bold for total row
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),  # Total row background
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
        expenses_data.append([expense.description, f"{expense.amount:.2f}"])
        total_expenses += expense.amount
    if total_expenses > 0:
        expenses_data.append(["Total", f"{total_expenses:.2f}"])

    if len(expenses_data) > 1:
        expenses_table = Table(expenses_data)
        expenses_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'LEFT'),  # Header left alignment
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),  # Amount column right alignment
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),  # Bold for total row
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),  # Total row background
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
        collections_data.append([collection.loan_application.customer.full_name, f"{collection.amount_paid:.2f}"])
        total_collections += collection.amount_paid
    if total_collections > 0:
        collections_data.append(["Total", f"{total_collections:.2f}"])

    if len(collections_data) > 1:
        collections_table = Table(collections_data)
        collections_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'LEFT'),  # Header left alignment
            ('ALIGN', (1, 1), (1, -1), 'RIGHT'),  # Amount column right alignment
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),  # Bold for total row
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),  # Total row background
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(Paragraph("Collections Received:", heading_style))
        elements.append(collections_table)
        elements.append(Spacer(1, 12))
    else:
        elements.append(Paragraph("No collections received today.", normal_style))
        elements.append(Spacer(1, 12))

    # Summary
    elements.append(Paragraph(f"Total Collections: {total_collections:.2f}", normal_style))
    elements.append(Paragraph(f"Total Expenses: {total_expenses:.2f}", normal_style))
    elements.append(Paragraph(f"Total Loans Disbursed: {total_loans:.2f}", normal_style))
    elements.append(Spacer(1, 12))

    # Final Balance (Current balance + Collections - Expenses - Loans disbursed)
    final_balance = current_balance + total_collections
    elements.append(Paragraph(f"Final Balance: {final_balance:.2f}", heading_style))

    # Build PDF
    doc.build(elements)
    return response