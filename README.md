# Quiz Application

This project is a real-time quiz application that leverages MongoDB, Redis, and WebSockets to enable a seamless and interactive quiz experience. The application supports user registration, matching users with similar interests, and conducting real-time quizzes.

## Installation and Setup

. Install Dependencies

Run the following command to install the required dependencies:

```bash
npm i
```

. Instantiate and Execute Docker Containers

Run the following command to start the MongoDB and Redis containers:

```bash
docker-compose up
```

Seeding Master Data

Seed the master data for interests and questions into the MongoDB database.

. Seed Interests

Run the following command to seed the master data for interests:

```bash
npm run seed:interests
```

. Seed Questions

Run the following command to seed the master data for questions:

```bash
npm run seed:questions
```

. Configure Environment Variables

Create a .env file in the root directory with the following contents:

```bash
MONGO_URI=mongodb://localhost:27017/quiz-app
REDIS_URL=redis://localhost:6379
JWT_SECRET=securesecretexample
```

. Start the Application

Run the following command to start the application:

```bash
npm start
```

Workflow

. Register Users

Use the /register endpoint in the provided Postman collection to register 2-3 users. Ensure that users share common interests by including the \_id values of interests from the master data in the request payload.

. Access Tokens

Upon successful registration, access tokens will be provided in the response. These tokens are valid for 1 hour.

. Login

Use the /login endpoint in the Postman collection to regenerate access tokens by providing the registered email and password.

. Establish Socket Connection

Establish a WebSocket connection for 2 or more users using the socket.io template in Postman:

Steps:

a. Open Postman: cmd/ctrl + n -> Select "Socket.IO" template.
b. Configure the connection:

```bash
Endpoint: <http://localhost:3001>

Headers:

authorization: Bearer [accessToken]

Example Authorization Header:

Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzhkMGE2Yjg0MGNhM2UwMDMxODVkOWYiLCJmaXJzdE5hbWUiOiJKb2huIDIiLCJpYXQiOjE3MzczMjUxODksImV4cCI6MTczNzMyODc4OX0.9fPr5OgPchBa1hZuAOArXdDEsQc98fondZ0Es5ojzyw

Socket.io Settings:

Client Version: v3

Handshake Path: /socket.io

Events to Listen for:

game:init

question:send

answer:submit

game:end
```

Starting a Quiz Session

. Start a Quiz Session

Use the /game/start endpoint in the Postman collection to start a quiz session. Pass the access token in the authorization header.

```bash
Endpoint:

POST <http://localhost:3001/game/start>

Headers:

Content-Type: application/json

Authorization: Bearer [accessToken]

Upon success, the endpoint will match the user with an opponent and emit events on their respective socket channels.

. Real-Time Events

Events Emitted:

game:init: Sent to participants with initial game details.

question:send: Sent at regular intervals with question details and the current scoreboard.

Submitting an Answer:

Emit the answer:submit event with the following JSON payload:

{
"quizId": "<Quiz ID returned from /game/start>",
"questionId": "[Question ID from question:send]",
"answer": "[ID of the selected option]"
}
```

. Quiz Completion

After all questions are answered, the game:end event will be emitted to participants, containing the final scores. The winner will be updated in the quiz record stored in the database.

```bash
Documentation

Socket.IO Connection Details

Endpoint: <http://localhost:3001>

Events:

game:init: Game initialization details.

question:send: Question and scoreboard updates.

answer:submit: Submit an answer.

game:end: Final scores and winner details.

Example Request

/game/start

Headers:

Content-Type: application/json

Authorization: Bearer [accessToken]
```

## Kubernetes: Explanation of the Components

## Deployments

Each deployment (quiz-backend, quiz-mongodb, quiz-redis) is defined with:
A single replica for simplicity.
Containers pointing to the required images.

## Services

NodePort service for quiz-backend to expose it externally on port 30001.
ClusterIP services for quiz-mongodb and quiz-redis for internal communication within the Kubernetes cluster.

## ConfigMap

Stores the environment variables like MONGO_URI and REDIS_URL.
Secret:

Stores sensitive data like JWT_SECRET, encoded in base64 for security.

## Steps to Deploy on Kubernetes (Docker Desktop or Minikube)

```bash
docker build -t quiz-backend:latest .
kubectl apply -f kube.yaml
```

Enjoy building and exploring the real-time quiz application!
