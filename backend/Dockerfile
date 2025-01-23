# Build stage
FROM golang:1.23-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装必要的系统依赖
RUN apk add --no-cache gcc musl-dev

# 复制 go mod 文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN CGO_ENABLED=1 GOOS=linux go build -o main .

# Final stage
FROM alpine:latest

WORKDIR /app

# 安装运行时依赖
RUN apk add --no-cache sqlite-libs

# 从构建阶段复制编译好的应用
COPY --from=builder /app/main .

# 创建数据目录
RUN mkdir -p /app/data

# 设置工作目录为数据目录
WORKDIR /app/data

# 暴露端口
EXPOSE 21108

# 运行应用
CMD ["/app/main"] 