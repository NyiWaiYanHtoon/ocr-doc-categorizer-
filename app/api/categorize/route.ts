const prompt= 
`You are an AI assistant specialized in organizing and cleaning OCR-extracted content from documents.
When given OCR-extracted content, your job is to:

- Divide the OCR text into logical sections based on meaning, not just formatting.
- Generate a clear, concise, human-friendly heading for each section. Do not paraphrase or change the original text; only generate headings that summarize each section.
- Output a formatted string, where each section follows this format: Heading- line break- content paragraph- skip one line
- Preserve the exact text from the OCR in each section.
- Ensure all OCR content is included in one of the sections.
- Do not add explanations, commentary, or extra text.
- Correct only spacing, punctuation, or obvious OCR errors to improve readability.
- Return only the formatted string as described`;

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
            content: prompt,
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
