import { env } from '../src/config/env';

async function checkBalance() {
  const query = `
    query {
      myself {
        id
        email
        balance
      }
    }
  `;

  const url = `https://api.runpod.io/graphql?api_key=${env.runpodApiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const resData = await response.json();
  console.log('GraphQL Result:', JSON.stringify(resData, null, 2));
}

checkBalance().catch(console.error);
