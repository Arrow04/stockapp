from tortoise.models import Model
from tortoise import fields

class User(Model):
    id = fields.IntField(pk=True)
    email = fields.CharField(max_length=255, unique=True)
    is_active = fields.BooleanField(default=True)
    is_2fa_enabled = fields.BooleanField(default=False)
    2fa_secret = fields.CharField(max_length=255)
    created_at = fields.DatetimeField(auto_now_add=True)
    class Meta:
        table = "users"

class Subscription(Model):
    id = fields.IntField(pk=True)
    user = fields.ForeignKeyField(models.User, related_name=subscriptions)
    plan_name = fields.CharField(max_length=100)
    is_active = fields.BooleanField(default=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    class Meta:
        table = subscriptions
