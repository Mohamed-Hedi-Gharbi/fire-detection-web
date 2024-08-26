from django                         import forms
from supervisor.models.parcelle     import Parcelle
from supervisor.models.node         import  Node
from django.contrib.gis.geos        import Point
from django.core.exceptions import ValidationError




class NodeForm(forms.ModelForm):
    NODE_REFERENCE_CHOICES = [
        ('eui-70b3d57ed00690fd', 'eui-70b3d57ed00690fd'),
        ('eui-70b3d57ed00690fc', 'eui-70b3d57ed00690fc'),
        ('eui-70b3d57ed0069a34', 'eui-70b3d57ed0069a34'),
        ('eui-70b3d57ed0068f79', 'eui-70b3d57ed0068f79'),
        ('eui-70b3d57ed0069f0e', 'eui-70b3d57ed0069f0e'),
    ]
    reference = forms.ChoiceField(
        choices=[('', 'Select parcelle')] + NODE_REFERENCE_CHOICES,
        widget=forms.Select(attrs={
            'class': 'form-control form-control-sm', 
            'id': 'nodeReference', 
            'style': 'height: calc(1.5em + .75rem + 3px);'
        })
    )
    class Meta:
        model = Node
        fields = ['name', 'reference', 'sensors', 'node_range', 'latitude', 'longitude', 'position', 'parcelle']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control form-control-sm', 'id': 'nodeName', 'style': 'height: calc(1.5em + .75rem + 3px);'}),
            'sensors': forms.TextInput(attrs={'class': 'form-control form-control-sm', 'id': 'nodeSensors', 'style': 'height: calc(1.5em + .75rem + 3px);'}),
            'node_range': forms.TextInput(attrs={'class': 'form-control form-control-sm', 'id': 'nodeOrder', 'style': 'height: calc(1.5em + .75rem + 3px);'}),
            'latitude': forms.HiddenInput(attrs={'id': 'id_latitude'}),
            'longitude': forms.HiddenInput(attrs={'id': 'id_longitude'}),
            'position': forms.HiddenInput(attrs={'id': 'nodePosition'}),
            'parcelle': forms.HiddenInput(attrs={'id': 'id_parcelle'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        position = cleaned_data.get('position')
        parcelle = cleaned_data.get('parcelle')
        parcelle_id = parcelle.id if parcelle else None
        
        if position and parcelle_id:
            try:
                parcelle = Parcelle.objects.get(id=parcelle_id)
                point = Point(position.y, position.x)
                print(point, parcelle.polygon)
                if not parcelle.polygon.contains(point):
                    raise ValidationError("The node must be placed inside the plot.")
            except Parcelle.DoesNotExist:
                raise ValidationError("Parcelle not found.")
        return cleaned_data
