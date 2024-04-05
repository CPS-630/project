# CPS630 - Project

TMU Connect is a web application that allows students to post advertisements for services or items for sale. It is built
with simplicity in mind, allowing students to quickly post and view advertisements.

## Running Dependencies
TMU Connect requires a database, S3 bucket and redis cache to run before starting the server or client. 

### Install Docker
**Note: If you already have docker installed, then continue to the next step.**

- Install Docker by following the instructions on the [Docker website](https://docs.docker.com/get-docker/).
- Start the Docker Daemon (or Docker Desktop).

### Start Docker Containers
Run the following command in the root directory of the project to start the containers:
```bash
docker-compose up -d
```
The database and S3 bucket will run and automatically create the necessary tables and buckets. No additional setup
should be necessary.

## Populating Database (Optional)
Populating the database with sample post data can be beneficial for testing/demo purposes, but is not required.

To populate the database with sample data, you will need to run a utility script found under the `utils` directory.
Please refer to the README.md file in the `utils` directory for instructions on how to run the script.

Steps for populating the database are found under the **"Populate Database with Users and Posts"** header of the 
`utils/README.md` file.
**Note:** Do not ignore the 'preparation' step before running the script.

## Running Client (Frontend)

### Setup
The frontend is a react app found under the `client` directory.

Install dependencies:
```bash
npm install
```

Create `.env` file under the `client` directory with the following Env variables:
```
REACT_APP_BACKEND_AUDIENCE=http://localhost:3000
REACT_APP_CLIENT_ID=HY3pomPr3uHny7BI1XMiWrVXJSuRmg6l
REACT_APP_DOMAIN=dev-cv8djkp6271234j7.us.auth0.com
```

### Run

Run the frontend with the following command:
```bash
npm start
```

When logging in, you can create an account using your gmail account.

## Running Server (Backend)
The backend is a node.js express server found under the `server` directory.

### Setup

Install dependencies:
```bash
npm install
```

Create `.env` file under the `server` directory with the following Env variables:
```env
BACKEND_AUDIENCE='http://localhost:3000'
AUTH0_DOMAIN=dev-cv8djkp6271234j7.us.auth0.com
AUTH0_CLIENT_ID=Nc7lSYxokOGX1JNFRahgzzmpOdG8LQt7
AUTH0_CLIENT_SECRET=<AUTH0_CLIENT_SECret>

DATABASE_URL=postgres://admin:password@localhost:5432/tmu_connect

S3_ENDPOINT='http://127.0.0.1:9000'
S3_ACCESS_KEY='root'
S3_SECRET_KEY='password'
```
**NOTE: Auth0 SECRET is sensitive and has not been included in the repo. Please request for the client secret or
identify where it may be provided.**

### Run

Run the backend with the following command:
```bash
npm run dev
```
