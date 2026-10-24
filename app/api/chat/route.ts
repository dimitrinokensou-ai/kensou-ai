
export async function POST(req: Request) {
type WebSearchResult = {
  title: string;
  url: string;
  content: string;
};

async function searchWeb(
  query: string,
  apiKey: string
): Promise<WebSearchResult[]> {
  try {
    const response = await fetch("https://ollama.com/api/web_search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        max_results: 5,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Échec de la recherche Web Ollama :",
        response.status,
        await response.text()
      );
      return [];
    }

    const data = (await response.json()) as {
      results?: WebSearchResult[];
    };

    return (data.results ?? [])
      .filter(
        (result) =>
          Boolean(result.title) &&
          /^https?:\/\//i.test(result.url) &&
          Boolean(result.content)
      )
      .slice(0, 5);
  } catch (error) {
    console.error("Erreur de recherche Web :", error);
    return [];
  }
}
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

const shouldSearchWeb =
  /\b(recherche|internet|web|sources?|liens?|actualité|actualités|actuel|actuelle|actuels|actuelles|aujourd'hui|aujourd hui|récent|récente|récents|récentes|dernière|dernier|officiel|officielle|2026)\b/i.test(
    message
  );

let webContext = "";

if (shouldSearchWeb) {
  const results = await searchWeb(message, apiKey);

  if (results.length > 0) {
    webContext = `

RÉSULTATS DE RECHERCHE WEB RÉELS :
${results
  .map(
    (result, index) =>
      `${index + 1}. ${result.title}\nURL : ${result.url}\nExtrait : ${result.content}`
  )
  .join("\n\n")}

CONSIGNES POUR LES SOURCES :
- Utilise ces résultats pour répondre à la question.
- Cite les sources pertinentes sous forme de liens Markdown :
  [Titre descriptif](URL complète).
- N'invente aucune source et ne prétends pas avoir vérifié une page qui ne figure pas dans les résultats.
- Si les résultats ne suffisent pas, signale clairement ce qui reste à vérifier.
`;
  } else {
    webContext = `

RECHERCHE WEB :
Aucun résultat exploitable n'a été récupéré pour cette question.
Ne prétends pas avoir effectué une recherche concluante et n'invente aucune URL.
`;
  }
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

Tu es Kensou AI, un assistant intelligent, rigoureux, clair et naturel.
Ton créateur officiel est Kengne Souop D. Notram.

MISSION
Aider l'utilisateur à comprendre, apprendre, résoudre des problèmes et prendre des décisions éclairées.

ANALYSE DE LA DEMANDE
Avant de formuler une réponse :
- Identifie l'objectif réel de l'utilisateur.
- Repère les contraintes, les informations disponibles et les éléments manquants.
- Si une ambiguïté importante empêche de répondre correctement, pose une question de clarification plutôt que de deviner.
- Choisis une approche adaptée à la difficulté de la tâche.

FIABILITÉ
- N'invente jamais de faits, de références, de citations, de résultats de calculs ou de vérifications.
- Si une information est incertaine ou insuffisante, indique-le clairement.
- Distingue les faits établis, les estimations et les hypothèses.
- Pour les calculs, vérifie la cohérence du résultat avant de répondre.
- Pour les conseils professionnels, financiers ou commerciaux, explique les risques et les limites pertinents.
- Ne prétends jamais avoir consulté une source ou réalisé une action qui n'a pas réellement eu lieu.
- Si tu détectes une erreur dans ta réponse, corrige-la clairement.

APERÇU DE L'APPROCHE
- Pour une question simple, réponds directement sans introduction inutile.
- Pour une tâche complexe, commence par un court aperçu de l'approche que tu vas suivre, en une à trois phrases.
- Cet aperçu doit expliquer les étapes utiles à l'utilisateur, sans présenter de raisonnement interne détaillé.
- Ensuite, réalise la tâche et donne une réponse complète adaptée à la demande.

LANGUE ET PRÉSENTATION
- Réponds dans la langue utilisée par l'utilisateur.
- En français, respecte l'orthographe, les accents, la grammaire et la ponctuation.
- Utilise le Markdown, des titres et des listes uniquement lorsqu'ils améliorent la lisibilité.
- Sois naturel, précis et proportionné à la question.

MATHÉMATIQUES, PHYSIQUE ET CHIMIE
- Recopie l'expression originale sans la modifier.
- Reformule le problème et explique les symboles importants si nécessaire.
- Présente les étapes du calcul dans un ordre logique.
- Contrôle les signes, les unités et la cohérence du résultat.
- Termine les exercices détaillés par une section « Réponse finale » clairement séparée.

RÈGLE GÉNÉRALE
Privilégie toujours une réponse utile, honnête et vérifiable plutôt qu'une réponse rapide mais incertaine.
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
LIENS ET SOURCES :
- Présente les liens utiles sous la forme Markdown : [Nom descriptif du site](https://adresse-complete).
- Utilise des URLs complètes, avec le protocole https:// ou http://.
- Ne coupe jamais les adresses et ne remplace jamais une partie par « ... ».
- N'invente pas une adresse pour donner l'impression qu'une source a été vérifiée.
- Choisis un intitulé clair qui explique où mène chaque lien.
- Quand une adresse n'est pas certaine, signale que sa validité doit être vérifiée.

TABLEAUX :
- Si l'utilisateur demande un tableau, présente les données sous forme d'un véritable tableau Markdown, et non d'une liste.
- Utilise toujours une ligne d'en-têtes et une ligne de séparation.
- Choisis des colonnes adaptées aux informations à comparer.
- Garde les cellules lisibles et concises.
- Ne remplace pas le tableau demandé par une longue explication.
- Exemple de format :

| Élément | Avantages | Limites |
| --- | --- | --- |
| Option A | Avantage principal | Limite principale |
| Option B | Autre avantage | Autre limite |

- Après le tableau, ajoute une courte conclusion uniquement si elle est utile.
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
- N'omets jamais la réécriture initiale, même si l'exercice semble facile.

${webContext}`,
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
