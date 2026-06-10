FROM node:20-slim
RUN apt-get update && apt-get install -y libglib2.0-bin zip && rm -rf /var/lib/apt/lists/*
WORKDIR /app
