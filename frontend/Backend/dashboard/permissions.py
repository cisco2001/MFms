from rest_framework import permissions

class IsLoanOfficer(permissions.BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'loanofficer')

class IsManagerUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_staff