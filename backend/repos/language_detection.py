import json
from pathlib import Path


LANGUAGE_EXTENSIONS = {
    '.py': 'Python',
    '.pyw': 'Python',
    '.ipynb': 'Python',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.mjs': 'JavaScript',
    '.cjs': 'JavaScript',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.c': 'C',
    '.h': 'C',
    '.cpp': 'C++',
    '.cc': 'C++',
    '.cxx': 'C++',
    '.hpp': 'C++',
    '.hh': 'C++',
    '.hxx': 'C++',
    '.rb': 'Ruby',
    '.go': 'Go',
    '.rs': 'Rust',
    '.java': 'Java',
    '.swift': 'Swift',
    '.kt': 'Kotlin',
    '.kts': 'Kotlin',
    '.php': 'PHP',
    '.cs': 'C#',
    '.dart': 'Dart',
    '.scala': 'Scala',
    '.r': 'R',
    '.sh': 'Shell',
    '.bash': 'Shell',
    '.zsh': 'Shell',
}


def detect_language(uploaded_file, path=''):
    file_path = path or getattr(uploaded_file, 'name', '')
    extension = Path(file_path).suffix.lower()

    if extension == '.ipynb':
        language = _detect_notebook_language(uploaded_file)
        if language:
            return language

    if extension in LANGUAGE_EXTENSIONS:
        return LANGUAGE_EXTENSIONS[extension]

    return _detect_from_content(uploaded_file)


def _detect_notebook_language(uploaded_file):
    content = _read_start(uploaded_file)
    if not content:
        return ''

    try:
        notebook = json.loads(content)
    except (TypeError, ValueError, json.JSONDecodeError):
        return ''

    language = (
        notebook.get('metadata', {})
        .get('kernelspec', {})
        .get('language')
        or notebook.get('metadata', {})
        .get('language_info', {})
        .get('name')
        or ''
    )
    return normalize_language(language)


def _detect_from_content(uploaded_file):
    content = _read_start(uploaded_file)
    if not content:
        return ''

    lowered = content.lower()
    heuristics = [
        ('TypeScript', ['interface ', 'type ', 'import type ', ': string', ': number']),
        ('JavaScript', ['function ', 'const ', 'let ', 'module.exports', 'console.log']),
        ('Python', ['def ', 'import ', 'from ', 'print(', '__name__ == "__main__"']),
        ('Java', ['public class ', 'public static void main', 'import java.']),
        ('Go', ['package main', 'func main()', 'import "fmt"']),
        ('Rust', ['fn main()', 'println!', 'use std::']),
        ('Ruby', ['def ', 'puts ', 'end', 'class ']),
        ('PHP', ['<?php', 'echo ', '$this->']),
        ('C#', ['using System', 'namespace ', 'Console.WriteLine']),
        ('Shell', ['#!/bin/bash', '#!/bin/sh', '#!/usr/bin/env bash']),
    ]

    for language, patterns in heuristics:
        if any(pattern.lower() in lowered for pattern in patterns):
            return language

    return ''


def _read_start(uploaded_file, limit=4096):
    try:
        if hasattr(uploaded_file, 'seek'):
            uploaded_file.seek(0)
        raw = uploaded_file.read(limit)
    except Exception:
        return ''
    finally:
        try:
            if hasattr(uploaded_file, 'seek'):
                uploaded_file.seek(0)
        except Exception:
            pass

    if isinstance(raw, bytes):
        return raw.decode('utf-8', errors='ignore')

    return raw or ''


def normalize_language(value):
    normalized = (value or '').strip()
    if not normalized:
        return ''

    aliases = {
        'python': 'Python',
        'javascript': 'JavaScript',
        'typescript': 'TypeScript',
        'c': 'C',
        'c++': 'C++',
        'ruby': 'Ruby',
        'go': 'Go',
        'rust': 'Rust',
        'java': 'Java',
        'swift': 'Swift',
        'kotlin': 'Kotlin',
        'php': 'PHP',
        'c#': 'C#',
        'dart': 'Dart',
        'scala': 'Scala',
        'r': 'R',
        'shell': 'Shell',
        'bash': 'Shell',
        'zsh': 'Shell',
    }
    return aliases.get(normalized.lower(), normalized)
