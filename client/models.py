from django.db                      import models
from django.contrib.auth.hashers    import make_password
from django.core.exceptions         import ValidationError
from django.core.mail               import send_mail
from django.template.loader         import render_to_string
from django.utils.html              import strip_tags
from django.contrib.auth.models     import BaseUserManager

class Client(models.Model):
    firstName   = models.CharField(max_length=25, blank=True)
    lastName    = models.CharField(max_length=25, blank=True)
    email       = models.EmailField(max_length=255, unique=True)
    phone       = models.CharField(max_length=12, blank=True)
    username    = models.CharField(max_length=30)
    password    = models.CharField(max_length=128)
    image       = models.ImageField(null=True, blank = True, upload_to='img')

    def __str__(self):
        return f'{self.firstName} {self.lastName}'

    def save(self, *args, **kwargs):
        is_new = self.pk is None  
        if is_new or 'password':
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

        if is_new:  
            #? Génération de mot de passe sécurisé pour l'envoi
            password = BaseUserManager().make_random_password()
            self.password = make_password(password)  #! Hash le mot de passe généré
            self.save(update_fields=['password'])

            context = {'client': self, 'password': password}
            subject = 'Welcome to Smart For Green'
            html_message = render_to_string('message.html', context)
            plain_message = strip_tags(html_message)
            from_email = 'From <mohamedhedigharbi101@gmail.com>'
            to = self.email

            #? Envoi de l'email
            send_mail(subject, plain_message, from_email, [to], html_message=html_message)

    def clean(self):
        if not self.firstName and not self.lastName:
            raise ValidationError("Either first name or last name must be provided.")
        if Client.objects.exclude(pk=self.pk).filter(email=self.email).exists():
            raise ValidationError("This email is already in use.")