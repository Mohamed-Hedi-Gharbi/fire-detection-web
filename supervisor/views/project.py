from django.shortcuts import render
from django.contrib.auth.decorators import login_required




@login_required(login_url='supervisor_login')
def project(request):
    return render(request, 'website/project.html', {})