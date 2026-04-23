from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view()),
    path('login/', TokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('me/', views.me_view),
    path('search/', views.search_users),
    path('<str:username>/', views.UserDetailView.as_view()),
    path('<str:username>/follow/', views.follow_view),
]
