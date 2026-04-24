from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Repository, RepositoryFile


class RepositoryLanguageTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='alice',
            email='alice@example.com',
            password='password123',
        )
        self.client.force_authenticate(self.user)

    def test_repo_creation_requires_language(self):
        response = self.client.post(
            '/api/repos/alice/',
            {
                'name': 'demo',
                'description': 'test repo',
                'visibility': 'public',
                'default_branch': 'main',
                'topics': [],
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('language', response.data)

    def test_upload_detects_file_language(self):
        repo = Repository.objects.create(
            owner=self.user,
            name='demo',
            visibility='public',
            language='Python',
        )

        upload = SimpleUploadedFile('index.tsx', b'export default function App() { return <div />; }')
        response = self.client.post(
            f'/api/repos/{self.user.username}/{repo.name}/files/',
            {
                'file': upload,
                'path': 'src/index.tsx',
                'branch': 'main',
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        stored_file = RepositoryFile.objects.get(repo=repo, path='src/index.tsx')
        self.assertEqual(stored_file.detected_language, 'TypeScript')

    def test_upload_sets_repo_language_when_missing(self):
        repo = Repository.objects.create(
            owner=self.user,
            name='empty-language',
            visibility='public',
            language='',
        )

        upload = SimpleUploadedFile('main.py', b'def hello():\n    return "world"\n')
        response = self.client.post(
            f'/api/repos/{self.user.username}/{repo.name}/files/',
            {
                'file': upload,
                'path': 'main.py',
                'branch': 'main',
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        repo.refresh_from_db()
        self.assertEqual(repo.language, 'Python')

    def test_upload_rejects_ignored_directories(self):
        repo = Repository.objects.create(
            owner=self.user,
            name='ignored-folder',
            visibility='public',
            language='JavaScript',
        )

        upload = SimpleUploadedFile('index.js', b'console.log("hello");')
        response = self.client.post(
            f'/api/repos/{self.user.username}/{repo.name}/files/',
            {
                'file': upload,
                'path': 'node_modules/react/index.js',
                'branch': 'main',
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('path', response.data)
        self.assertFalse(RepositoryFile.objects.filter(repo=repo).exists())

    def test_non_owner_cannot_update_repository(self):
        other_user = get_user_model().objects.create_user(
            username='bob',
            email='bob@example.com',
            password='password123',
        )
        repo = Repository.objects.create(
            owner=other_user,
            name='demo',
            visibility='public',
            language='Python',
            description='original',
        )

        response = self.client.patch(
            f'/api/repos/{other_user.username}/{repo.name}/',
            {'description': 'changed'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        repo.refresh_from_db()
        self.assertEqual(repo.description, 'original')

    def test_owner_can_delete_repository(self):
        repo = Repository.objects.create(
            owner=self.user,
            name='danger-zone',
            visibility='private',
            language='Python',
        )

        response = self.client.delete(f'/api/repos/{self.user.username}/{repo.name}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Repository.objects.filter(id=repo.id).exists())
