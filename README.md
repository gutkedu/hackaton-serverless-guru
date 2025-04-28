# LiveStream App

A serverless live streaming application built with AWS Kinesis Video Streams, WebRTC, and Momento Cache.

## Architecture

The application consists of:
- React frontend for streaming and viewing
- AWS Lambda backend for stream channel creation
- Momento Cache for metadata storage

## Setup

### Prerequisites
- AWS CLI configured
- SAM CLI installed
- Node.js v18+ installed
- Momento Cache API key

### Backend Deployment

1. Install dependencies:
```bash
cd backend
npm install
```

2. Build and deploy:
```bash
cd ..
sam build
sam deploy --guided
```

### Frontend Development

1. Create a `.env` file in the frontend directory:
```bash
cd frontend
cp .env.example .env
```

2. Add your AWS credentials to the `.env` file:
```
VITE_AWS_ACCESS_KEY_ID=your_access_key_here
VITE_AWS_SECRET_ACCESS_KEY=your_secret_key_here
VITE_API_URL=https://your-api-gateway-url.execute-api.region.amazonaws.com/dev
```

3. Install dependencies and start the development server:
```bash
npm install
npm run dev
```

## Usage

1. Navigate to the home page and create a stream channel
2. Once created, you'll be redirected to the stream page
3. Click "Start Streaming" to begin broadcasting
4. Share the URL with viewers