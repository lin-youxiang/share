docker build -t shareapp-backend .

docker run --network host -v ./data:/app/data shareapp-backend