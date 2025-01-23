# 构建镜像
docker build -t shareapp-frontend .

# 运行容器
docker run --network host shareapp-frontend