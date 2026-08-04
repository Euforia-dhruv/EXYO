#!/bin/bash
# scripts/deploy-4k-addon.sh
# Deploy the Torrent-to-Weblink Stremio addon for 4K streaming

echo "Deploying 4K Stremio Addon..."

echo ""
echo "Option 1: Deploy to Hugging Face Spaces (16GB RAM FREE)"
echo "1. Go to https://huggingface.co/new-space"
echo "2. Select 'Docker' and 'Blank'"
echo "3. Add this Dockerfile:"
cat << 'EOF'
FROM node:20-alpine
WORKDIR /app
RUN git clone https://github.com/Aswinajay/stremio-addon.git .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
EOF
echo "4. Click 'Create Space'"
echo "5. Your addon URL: https://YOUR-USERNAME.hf.space/manifest.json"

echo ""
echo "Option 2: Deploy to Render.com (512MB RAM FREE)"
echo "1. Go to https://render.com"
echo "2. Click 'New Web Service'"
echo "3. Connect GitHub repo: Aswinajay/stremio-addon"
echo "4. Build Command: npm install"
echo "5. Start Command: npm start"
echo "6. Your URL: https://your-service.onrender.com/manifest.json"

echo ""
echo "Option 3: Deploy locally"
echo "1. git clone https://github.com/Aswinajay/stremio-addon.git"
echo "2. cd stremio-addon"
echo "3. npm install"
echo "4. npm start"
echo "5. Your addon URL: http://localhost:3000/manifest.json"
echo ""
echo "After deploying, add the URL in EXYO Settings > Addons > Install custom addon via URL"
