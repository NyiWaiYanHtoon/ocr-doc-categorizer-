export async function POST(req: Request) {
  const { ocrText } = await req.json(); // match the client

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant specialized in organizing and cleaning OCR-extracted content from documents.
When given OCR-extracted content, your job is to:

1. Divide the content into logical sections based on meaning, not just existing formatting.
2. For each section, generate a **clear, human-friendly heading** that summarizes its topic in a few words (do not just copy the original text unless it is already a perfect heading).
3. Output the result as an **array of JSON objects**, each in the form: { "heading": "Generated Heading", "content": "Full cleaned paragraph text" }.
4. Correct spacing, punctuation, and grammar to improve readability, but preserve the meaning of the text.
5. Include **all** content from the OCR in one of the sections (do not drop anything).
6. Return **only** the JSON array — no explanations, no markdown, no extra text.`,
          },
          { role: "user", content: ocrText },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    }
  );

  const data = await response.json();
  console.log("data: ", data);
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
