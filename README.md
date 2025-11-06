# Code Helper AI Agent for Telex.im

An AI-powered programming assistant that helps developers with coding questions, debugging, and code examples.

## Features

- Answers programming questions across multiple languages
- Provides runnable code examples with explanations
- Helps debug code issues
- Explains programming concepts and best practices
- Supports JavaScript, TypeScript, Python, Java, Go, and more

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Start the server: `npm start`

## Telex.im Integration

1. Deploy the agent to your preferred cloud platform (Vercel, Railway, etc.)
2. Update the `url` in `workflow.json` with your deployment URL
3. Import the workflow JSON into Telex.im
4. Activate the workflow in your Telex.im settings

## API Endpoints

- `POST /a2a/agent/:agentId` - Main A2A endpoint

## Example Usage

Send a message to the agent through Telex.im:
