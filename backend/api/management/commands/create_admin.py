import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Create a superuser from environment variables if one does not exist.'

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.environ.get('ADMIN_USERNAME')
        password = os.environ.get('ADMIN_PASSWORD')

        if not username or not password:
            self.stdout.write(self.style.WARNING("ADMIN_USERNAME or ADMIN_PASSWORD not set in environment."))
            return

        user, created = User.objects.get_or_create(username=username)
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f'Successfully created superuser "{username}".'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Successfully updated password for superuser "{username}".'))
