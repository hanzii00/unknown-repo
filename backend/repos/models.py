from django.db import models
from users.models import User

class Repository(models.Model):
    VISIBILITY_CHOICES = [('public','Public'),('private','Private')]
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='repositories')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='public')
    language = models.CharField(max_length=50, blank=True)
    stars = models.ManyToManyField(User, related_name='starred_repos', blank=True)
    forks_count = models.IntegerField(default=0)
    default_branch = models.CharField(max_length=100, default='main')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    topics = models.JSONField(default=list)

    class Meta:
        unique_together = ['owner', 'name']
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.owner.username}/{self.name}"

    @property
    def stars_count(self):
        return self.stars.count()

class Issue(models.Model):
    STATE_CHOICES = [('open','Open'),('closed','Closed')]
    repo = models.ForeignKey(Repository, on_delete=models.CASCADE, related_name='issues')
    title = models.CharField(max_length=500)
    body = models.TextField(blank=True)
    state = models.CharField(max_length=10, choices=STATE_CHOICES, default='open')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_issues')
    labels = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    number = models.IntegerField()

    class Meta:
        unique_together = ['repo','number']
        ordering = ['-created_at']

class Comment(models.Model):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Star(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    repo = models.ForeignKey(Repository, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user','repo']
