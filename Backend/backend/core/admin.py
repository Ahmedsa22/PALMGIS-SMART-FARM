from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, AuditLog


class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Rôle", {"fields": ("role",)}),
    )
    list_display = ("username", "email", "role", "is_staff", "is_active")
    list_filter = UserAdmin.list_filter + ("role",)


admin.site.register(User, CustomUserAdmin)
admin.site.register(AuditLog)