from rest_framework import permissions

class IsManagerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow managers to edit an object.
    Assumes your User model has an 'is_manager' property or check.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any request,
        # so we always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed if the user is authenticated 
        # and has a manager attribute set to True (adjust to match your User model)
        return request.user and request.user.is_authenticated and getattr(request.user, 'is_manager', False)