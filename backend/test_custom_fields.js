
const query = `
  query {
    collaborators {
        id
        userName
        customFields {
            id
            value
        }
        hardware {
            id
            name
        }
    }
  }
`;

async function test() {
  try {
    const response = await fetch('http://localhost:3000/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText} ` + await response.text());
    }

    const json = await response.json();
    if (json.errors) {
        console.error("GraphQL Errors:", JSON.stringify(json.errors, null, 2));
        process.exit(1);
    }
    
    console.log("Success! Data received:", JSON.stringify(json.data, null, 2));
  } catch (err) {
    console.error("Test Failed:", err);
    process.exit(1);
  }
}

test();
