Build and Deploy

# Build v14

docker build -t peresjav/yue-serverless:v14 .

# Tag as latest

docker tag peresjav/yue-serverless:v14 peresjav/yue-serverless:latest

# Push v14

docker push peresjav/yue-serverless:v14

# Push latest

docker push peresjav/yue-serverless:latest
