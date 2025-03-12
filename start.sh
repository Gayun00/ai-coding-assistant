#!/bin/bash

# .env 파일에서 환경변수 로드
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# API 키 확인
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY is not set in .env file"
    exit 1
fi

# 기존 컨테이너 정리
echo "🧹 Cleaning up existing container..."
docker stop openwebui 2>/dev/null
docker rm openwebui 2>/dev/null

# OpenWebUI 실행
echo "🚀 Starting OpenWebUI..."
docker run -d --name openwebui \
  -p 3000:8080 \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  ghcr.io/open-webui/open-webui:main

echo "⏳ Waiting for service to start..."
sleep 5

echo "✨ OpenWebUI should be running at http://localhost:8080" 