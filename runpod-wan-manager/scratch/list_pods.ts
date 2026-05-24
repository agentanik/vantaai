import dotenv from 'dotenv';
dotenv.config();
const API_KEY = process.env.RUNPOD_API_KEY || "";
const BASE_URL = "https://api.runpod.io/graphql";

const query = `
query getPods {
  myself {
    pods {
      id
      name
      desiredStatus
    }
  }
}
`;

async function listPods() {
  console.log("Querying GraphQL API...");
  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api_key": API_KEY
      },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    console.log("GraphQL Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("GraphQL Error:", err);
  }

  console.log("\nQuerying REST API...");
  try {
    const res = await fetch("https://api.runpod.io/v2/pods", {
      headers: {
        "Authorization": `Bearer ${API_KEY}`
      }
    });
    const data = await res.json();
    console.log("REST v2 Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("REST v2 Error:", err);
  }

  console.log("\nQuerying REST v1 API...");
  try {
    const res = await fetch("https://rest.runpod.io/v1/pods", {
      headers: {
        "Authorization": `Bearer ${API_KEY}`
      }
    });
    const data = await res.json();
    console.log("REST v1 Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("REST v1 Error:", err);
  }
}

listPods();
