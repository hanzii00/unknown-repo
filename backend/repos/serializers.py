from rest_framework import serializers
from .models import Repository, Issue, Comment
from users.serializers import UserSerializer

class RepositorySerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    stars_count = serializers.ReadOnlyField()
    is_starred = serializers.SerializerMethodField()

    class Meta:
        model = Repository
        fields = ['id','owner','name','description','visibility','language','stars_count',
                  'forks_count','default_branch','created_at','updated_at','topics','is_starred']
        read_only_fields = ['id','owner','stars_count','forks_count','created_at','updated_at']

    def get_is_starred(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.stars.filter(id=request.user.id).exists()
        return False

class RepositoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Repository
        fields = ['name','description','visibility','language','default_branch','topics']

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    class Meta:
        model = Comment
        fields = ['id','author','body','created_at','updated_at']
        read_only_fields = ['id','author','created_at','updated_at']

class IssueSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    comments_count = serializers.SerializerMethodField()
    class Meta:
        model = Issue
        fields = ['id','number','title','body','state','author','labels','created_at','updated_at','comments_count']
        read_only_fields = ['id','number','author','created_at','updated_at']

    def get_comments_count(self, obj):
        return obj.comments.count()
