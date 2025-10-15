const GEMINI_API_KEY = "AIzaSyCjJMnFpEFah4yOeVkpLC6UUv6zCmaYZEs";

const res = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: "Olá, Gemini! Podes confirmar que a minha chave funciona?" }],
        },
      ],
    }),
  }
);

const data = await res.json();
console.log("🔍 Resposta:", data);
