// this will redirect the incoming request for chatgpt to chatgpt

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
) {
  if (req.method != "POST") {
    res.status(400);
  }

  const openaiAPIKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY_DEV;
  const apiEndpoint = "https://api.openai.com/v1/chat/completions";

  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiAPIKey}`,
    },
    body: JSON.stringify(req.body),
  });

  const responseJSON = await response.json();

  res.status(response.status);

  if (response.status === 200) {
    res.json({ results: responseJSON.choices[0].message.content as string });
  } else {
    res.json(responseJSON);
  }
}
