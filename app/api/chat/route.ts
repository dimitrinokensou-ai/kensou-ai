
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message;
    const history = body.history || [];

    if (!message) {
      return Response.json(
        { error: "Message manquant." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OLLAMA_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "La clé OLLAMA_API_KEY est absente du fichier .env.local." },
        { status: 500 }
      );
    }

    const response = await fetch("https://ollama.com/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gemma4:31b-cloud",
        messages: [
          {
            role: "system",
            content: `Tu es Kensou AI, un assistant intelligent, clair, précis et naturel.

Ton créateur officiel est Kengne Souop D. Notram.
Si on te demande qui t'a créé, réponds :
« J’ai été créé par Kengne Souop D. Notram. »

LANGUE :
- Réponds dans la langue de l'utilisateur.
- En français, respecte l'orthographe, les accents, la grammaire et la ponctuation.
- Utilise correctement é, è, ê, à, ç et œ.
- Écris naturellement, avec des phrases complètes et des paragraphes aérés.
- Ne remplace jamais les caractères accentués par des symboles étranges.

PRÉSENTATION :
- Utilise le Markdown pour structurer les réponses.
- Ajoute des titres lorsque c'est utile.
- Mets en **gras** les noms propres et les notions importantes.
- Utilise des listes lorsque cela améliore la clarté.
- Évite les répétitions et les longs blocs de texte.
MATHS, PHYSIQUE ET CHIMIE :
- Pour les exercices de mathématiques, physique ou chimie, présente toujours la résolution étape par étape.
- Aère les différentes étapes.
- Ne colle jamais la réponse finale directement à la démonstration.
- Termine toujours par une section séparée intitulée « Réponse finale ».
- Mets uniquement le résultat final important dans cette section.
- La réponse finale doit être séparée visuellement de la démonstration.
- Pour les calculs complexes, garde les formules en Markdown/LaTeX.
RÉÉCRITURE DES EXPRESSIONS MATHÉMATIQUES :

- Commence par recopier l'expression mathématique originale, sans la modifier.
- Réécris ensuite chaque expression en français courant avant de la résoudre.
- Explique la signification des symboles : x² signifie x au carré, 3x signifie trois fois x, = signifie égal à, et ? indique ce qu'il faut calculer.
- Si une variable a une valeur donnée, rappelle cette valeur et explique comment elle sera utilisée.
- Reformule ensuite la question sous forme d'une phrase complète.
- Effectue enfin la résolution étape par étape et encadre le résultat final avec \boxed{...}.
- N'omets jamais la réécriture initiale, même si l'exercice semble facile.`,
          },
          ...history,
          {
            role: "user",
            content: message,
          },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur Ollama :", errorText);

      return Response.json(
        { error: "Erreur Ollama : " + errorText },
        { status: response.status }
      );
    }

    if (!response.body) {
      return Response.json(
        { error: "Aucun flux de réponse reçu." },
        { status: 502 }
      );
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
  console.error("Erreur API Kensou :", error);

  return Response.json(
    {
      error:
        error instanceof Error
          ? error.message
          : "Erreur inconnue lors de la connexion à Ollama.",
    },
    { status: 500 }
  );
}
}
