from django.urls import path
from . import views

urlpatterns = [
    path('explore/', views.explore_repos),
    path('<str:username>/', views.RepositoryListCreateView.as_view()),
    path('<str:username>/<str:name>/', views.RepositoryDetailView.as_view()),
    path('<str:username>/<str:name>/star/', views.star_repo),
    path('<str:username>/<str:name>/files/', views.RepositoryFileListCreateView.as_view()),
    path('<str:username>/<str:name>/files/<int:file_id>/', views.RepositoryFileDetailView.as_view()),
    path('<str:username>/<str:name>/issues/', views.IssueListCreateView.as_view()),
    path('<str:username>/<str:name>/issues/<int:number>/', views.IssueDetailView.as_view()),
    path('<str:username>/<str:name>/issues/<int:number>/comments/', views.CommentListCreateView.as_view()),
]
