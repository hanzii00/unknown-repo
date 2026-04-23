from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    followers_count = serializers.ReadOnlyField()
    following_count = serializers.ReadOnlyField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id','username','email','bio','avatar_url','location','website','company',
                  'followers_count','following_count','is_following','date_joined']
        read_only_fields = ['id','date_joined']

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.followers.filter(id=request.user.id).exists()
        return False

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username','email','password']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
