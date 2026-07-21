from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        MANAGER = "manager", "Gestionnaire"
        VIEWER = "viewer", "Consultant"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.VIEWER,
    )

    @property
    def is_manager(self):
        return self.role == self.Role.MANAGER

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(class)s_created",
    )

    class Meta:
        abstract = True


class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = "create", "Création"
        UPDATE = "update", "Modification"
        DELETE = "delete", "Suppression"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
    )
    action = models.CharField(max_length=10, choices=Action.choices)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(blank=True, null=True)

    def __str__(self):
        return f"{self.action} - {self.model_name}#{self.object_id} par {self.user}"