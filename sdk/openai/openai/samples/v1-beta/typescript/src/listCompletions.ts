// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Demonstrates how to list completions for the provided prompt.
 *
 * @summary list completions.
 */

import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

// Load the .env file if it exists
import * as dotenv from "dotenv";
dotenv.config();

// You will need to set these environment variables or edit the following values
const endpoint = process.env["ENDPOINT"] || "<endpoint>";
const azureApiKey = process.env["AZURE_API_KEY"] || "<api key>";

const prompt = ["What is Azure OpenAI?"];

export async function main() {
  console.log("== Stream Completions Sample ==");

  const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));
  const deploymentId = "text-davinci-003";
  const events = client.listCompletions(deploymentId, prompt, { maxTokens: 128 });

  for await (const event of events) {
    for (const choice of event.choices) {
      console.log(choice.text);
    }
  }
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});
