// Import the Genkit core libraries and plugins.
import {genkit, z} from "genkit";
import {vertexAI} from "@genkit-ai/vertexai";

// Import models from the Vertex AI plugin. The Vertex AI API provides access to
// several generative models. Here, we import Gemini 2.0 Flash.
import {gemini20Flash} from "@genkit-ai/vertexai";

// Cloud Functions for Firebase supports Genkit natively. The onCallGenkit function creates a callable
// function from a Genkit action. It automatically implements streaming if your flow does.
// The https library also has other utility methods such as hasClaim, which verifies that
// a caller's token has a specific claim (optionally matching a specific value)
// import { onCallGenkit, hasClaim } from "firebase-functions/https";

// Genkit models generally depend on an API key. APIs should be stored in Cloud Secret Manager so that
// access to these sensitive values can be controlled. defineSecret does this for you automatically.
// If you are using Google generative AI you can get an API key at https://aistudio.google.com/app/apikey
// import { defineSecret } from "firebase-functions/params";
// const apiKey = defineSecret("GOOGLE_GENAI_API_KEY");

// The Firebase telemetry plugin exports a combination of metrics, traces, and logs to Google Cloud
// Observability. See https://firebase.google.com/docs/genkit/observability/telemetry-collection.
import {enableFirebaseTelemetry} from "@genkit-ai/firebase";
enableFirebaseTelemetry();

const ai = genkit({
  plugins: [
    // Load the Vertex AI plugin. You can optionally specify your project ID
    // by passing in a config object; if you don't, the Vertex AI plugin uses
    // the value from the GCLOUD_PROJECT environment variable.
    vertexAI({location: "us-central1"}),
  ],
});

// Define a simple flow that prompts an LLM to generate menu suggestions.
const menuSuggestionFlow = ai.defineFlow({
    name: "menuSuggestionFlow",
    inputSchema: z.string().describe("A restaurant theme").default("seafood"),
    outputSchema: z.string(),
    streamSchema: z.string(),
  }, async (subject, { sendChunk }) => {
    // Construct a request and send it to the model API.
    const prompt =
      `Suggest an item for the menu of a ${subject} themed restaurant`;
    const { response, stream } = ai.generateStream({
      model: gemini20Flash,
      prompt: prompt,
      config: {
        temperature: 1,
      },
    });

    for await (const chunk of stream) {
      sendChunk(chunk.text);
    }

    // Handle the response from the model API. In this sample, we just
    // convert it to a string, but more complicated flows might coerce the
    // response into structured output or chain the response into another
    // LLM call, etc.
    return (await response).text;
  }
);

// Example data type for a menu suggestion
interface MenuSuggestion {
  name: string;
  createdBy: string; // email
  // ...other fields
}

// Simulated database (replace with your actual DB logic)
const db: Record<string, MenuSuggestion> = {};

// Create function: sets createdBy only on creation
function createMenuSuggestion(data: Omit<MenuSuggestion, 'createdBy'>, userEmail: string): MenuSuggestion {
  const newSuggestion: MenuSuggestion = {
    ...data,
    createdBy: userEmail, // Set only on creation
  };
  db[data.name] = newSuggestion;
  return newSuggestion;
}

// Update function: never allows updating createdBy
function updateMenuSuggestion(name: string, data: Partial<Omit<MenuSuggestion, 'createdBy'>>): MenuSuggestion | null {
  const existing = db[name];
  if (!existing) return null;
  // Always preserve the original createdBy
  const updated = { ...existing, ...data, createdBy: existing.createdBy };
  db[name] = updated;
  return updated;
}

// export const menuSuggestion = onCallGenkit({
//   secrets: [apiKey],
// }, menuSuggestionFlow);
