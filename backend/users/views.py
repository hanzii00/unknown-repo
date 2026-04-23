from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from .models import User
from .serializers import UserSerializer, RegisterSerializer

class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)

class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    lookup_field = 'username'
    queryset = User.objects.all()

    def get_permissions(self):
        if self.request.method in ['PUT','PATCH']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me_view(request):
    serializer = UserSerializer(request.user, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def follow_view(request, username):
    target = get_object_or_404(User, username=username)
    if target == request.user:
        return Response({'error': 'Cannot follow yourself'}, status=400)
    if target.followers.filter(id=request.user.id).exists():
        target.followers.remove(request.user)
        return Response({'following': False})
    target.followers.add(request.user)
    return Response({'following': True})

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def search_users(request):
    q = request.query_params.get('q', '')
    users = User.objects.filter(username__icontains=q)[:10]
    return Response(UserSerializer(users, many=True, context={'request': request}).data)
