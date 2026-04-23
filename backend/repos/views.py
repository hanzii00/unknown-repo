from rest_framework import generics, status, permissions, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Repository, Issue, Comment, RepositoryFile
from .serializers import (RepositorySerializer, RepositoryCreateSerializer,
                          IssueSerializer, CommentSerializer, RepositoryFileSerializer)
from users.models import User

class RepositoryListCreateView(generics.ListCreateAPIView):
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name','description','language']
    ordering_fields = ['updated_at','created_at','name']

    def get_queryset(self):
        username = self.kwargs.get('username')
        qs = Repository.objects.select_related('owner')
        if username:
            qs = qs.filter(owner__username=username)
        if not self.request.user.is_authenticated:
            qs = qs.filter(visibility='public')
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return RepositoryCreateSerializer
        return RepositorySerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

class RepositoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    lookup_field = 'name'

    def get_queryset(self):
        return Repository.objects.filter(owner__username=self.kwargs['username'])

    def get_serializer_class(self):
        if self.request.method in ['PUT','PATCH']:
            return RepositoryCreateSerializer
        return RepositorySerializer

    def get_permissions(self):
        if self.request.method in ['PUT','PATCH','DELETE']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def star_repo(request, username, name):
    repo = get_object_or_404(Repository, owner__username=username, name=name)
    if repo.stars.filter(id=request.user.id).exists():
        repo.stars.remove(request.user)
        return Response({'starred': False, 'stars_count': repo.stars_count})
    repo.stars.add(request.user)
    return Response({'starred': True, 'stars_count': repo.stars_count})

@api_view(['GET'])
def explore_repos(request):
    q = request.query_params.get('q', '')
    lang = request.query_params.get('language', '')
    qs = Repository.objects.filter(visibility='public').select_related('owner')
    if q:
        qs = qs.filter(Q(name__icontains=q)|Q(description__icontains=q))
    if lang:
        qs = qs.filter(language__icontains=lang)
    qs = qs.order_by('-updated_at')[:30]
    return Response(RepositorySerializer(qs, many=True, context={'request': request}).data)

class IssueListCreateView(generics.ListCreateAPIView):
    serializer_class = IssueSerializer

    def get_queryset(self):
        repo = get_object_or_404(Repository, owner__username=self.kwargs['username'], name=self.kwargs['name'])
        state = self.request.query_params.get('state', 'open')
        return Issue.objects.filter(repo=repo, state=state).select_related('author')

    def perform_create(self, serializer):
        repo = get_object_or_404(Repository, owner__username=self.kwargs['username'], name=self.kwargs['name'])
        last = Issue.objects.filter(repo=repo).order_by('-number').first()
        number = (last.number + 1) if last else 1
        serializer.save(repo=repo, author=self.request.user, number=number)

class IssueDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = IssueSerializer

    def get_object(self):
        return get_object_or_404(Issue, repo__owner__username=self.kwargs['username'],
                                 repo__name=self.kwargs['name'], number=self.kwargs['number'])

class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer

    def get_queryset(self):
        issue = get_object_or_404(Issue, repo__owner__username=self.kwargs['username'],
                                  repo__name=self.kwargs['name'], number=self.kwargs['number'])
        return Comment.objects.filter(issue=issue).select_related('author')

    def perform_create(self, serializer):
        issue = get_object_or_404(Issue, repo__owner__username=self.kwargs['username'],
                                  repo__name=self.kwargs['name'], number=self.kwargs['number'])
        serializer.save(issue=issue, author=self.request.user)

class RepositoryFileListCreateView(generics.ListCreateAPIView):
    serializer_class = RepositoryFileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        repo = get_object_or_404(Repository, owner__username=self.kwargs['username'], name=self.kwargs['name'])
        branch = self.request.query_params.get('branch', 'main')
        return RepositoryFile.objects.filter(repo=repo, branch=branch).order_by('path')

    def perform_create(self, serializer):
        repo = get_object_or_404(Repository, owner__username=self.kwargs['username'], name=self.kwargs['name'])
        if repo.owner != self.request.user:
            self.permission_denied(self.request, 'Only the repo owner can upload files.')
        
        file_obj = self.request.FILES.get('file')
        if not file_obj:
            return
        
        branch = self.request.data.get('branch', 'main')
        path = self.request.data.get('path', file_obj.name)
        
        # Delete existing file with same path if it exists
        RepositoryFile.objects.filter(repo=repo, path=path, branch=branch).delete()
        
        # Create new file
        serializer.save(repo=repo, file=file_obj, size=file_obj.size, path=path, branch=branch)

class RepositoryFileDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = RepositoryFileSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        repo = get_object_or_404(Repository, owner__username=self.kwargs['username'], name=self.kwargs['name'])
        return RepositoryFile.objects.filter(repo=repo)

    def get_object(self):
        qs = self.get_queryset()
        file_id = self.kwargs.get('file_id')
        return get_object_or_404(qs, id=file_id)

    def perform_destroy(self, instance):
        if instance.repo.owner != self.request.user:
            self.permission_denied(self.request, 'Only the repo owner can delete files.')
        instance.delete()
