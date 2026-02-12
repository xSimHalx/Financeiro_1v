#!/bin/bash
cd "$(dirname "$0")"
echo "Iniciando VertexAds Sync + Auth API..."
echo ""
node server.js
read -p "Pressione Enter para fechar..."
