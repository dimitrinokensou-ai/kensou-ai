"use client";

import { BrowserWhisper } from "browser-whisper";
import { supabase } from "../lib/supabase";
import {useEffect , ChangeEvent, KeyboardEvent, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const modes = [
  {
    name: "Standard",
    slogan: "Pour tout comprendre, simplement.",
    description: "Questions générales, études, rédaction et traduction.",
    icon: "standard",
  },
  {
    name: "Advanced",
    slogan: "Pour réfléchir plus loin.",
    description: "Analyse approfondie, raisonnement et projets complexes.",
    icon: "advanced",
  },
  {
    name: "Coding",
    slogan: "Construis. Code. Résous.",
    description: "Programmation, debugging et création de projets.",
    icon: "coding",
  },
  {
    name: "Business",
    slogan: "Des idées. Des stratégies.",
    description: "Stratégie, organisation et développement de projets.",
    icon: "business",
  },
];

function ModeIcon({
  type,
  className = "",
}: {
  type: string;
  className?: string;
}) {
  if (type === "standard") {
    return (
      <svg className={`mode-real-icon ${className}`} viewBox="0 0 48 48" fill="none">
        <circle cx="21" cy="21" r="11" stroke="currentColor" strokeWidth="3" />
        <path d="M29 29L39 39" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M33 10L35 14L39 16L35 18L33 22L31 18L27 16L31 14L33 10Z" fill="currentColor" />
      </svg>
    );
  }

  if (type === "advanced") {
    return (
      <svg className={`mode-real-icon ${className}`} viewBox="0 0 56 48" fill="none">
        <circle cx="12" cy="25" r="7" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="28" cy="18" r="9" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="44" cy="25" r="7" stroke="currentColor" strokeWidth="2.5" />
        <path d="M17 21L21 19M35 19L39 21M17 29L22 32M34 32L39 29" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M12 7L14 11L18 13L14 15L12 19L10 15L6 13L10 11L12 7Z" fill="currentColor" />
        <path d="M28 1L30 5L34 7L30 9L28 13L26 9L22 7L26 5L28 1Z" fill="currentColor" />
        <path d="M44 7L46 11L50 13L46 15L44 19L42 15L38 13L42 11L44 7Z" fill="currentColor" />
      </svg>
    );
  }

  if (type === "coding") {
    return (
      <svg className={`mode-real-icon ${className}`} viewBox="0 0 52 48" fill="none">
        <path d="M18 10L5 24L18 38" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M34 10L47 24L34 38" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 7L22 41" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className={`mode-real-icon ${className}`} viewBox="0 0 52 48" fill="none">
      <path d="M9 19H43L38 12H14L9 19Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M14 19V36M21 19V36M31 19V36M38 19V36" stroke="currentColor" strokeWidth="2.5" />
      <path d="M8 36H44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="42" cy="10" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M42 7.5V12.5M39.5 10H44.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
const [authLoading, setAuthLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [diversOpen, setDiversOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState("Standard");
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);

const startLocalWhisper = async () => {
  try {
    const whisper = new BrowserWhisper({
      model: "whisper-tiny",
      language: "fr",
    });

    await whisper.downloadModel({
      onProgress: ({ stage, progress }) => {
        console.log(
          `Whisper — ${stage}: ${Math.round(progress * 100)}%`
        );
      },
    });

    console.log("Whisper local est chargé et prêt.");
  } catch (error) {
    console.error("Erreur Whisper local :", error);
    alert("Impossible de charger Whisper local.");
  }
};

const startVoiceInput = () => {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("La reconnaissance vocale n'est pas prise en charge par ce navigateur.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "fr-FR";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => setIsListening(true);

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    setMessage((previous) =>
      previous.trim()
        ? `${previous.trim()} ${transcript}`
        : transcript
    );
  };

  recognition.onerror = (event: any) => {
  console.error("Erreur de reconnaissance vocale :", event.error);
  alert("Erreur vocale : " + event.error);
};

  recognition.onend = () => setIsListening(false);

  recognition.start();
};
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [conversationId, setConversationId] = useState<number | null>(null);
const [conversationTitle, setConversationTitle] = useState("Nouvelle conversation");

const [conversations, setConversations] = useState<
  { id: number; title: string; messages: Message[] }[]
>([]);
const [historySelectionMode, setHistorySelectionMode] = useState(false);
const [selectedConversationIds, setSelectedConversationIds] = useState<number[]>([]);
const [openHistoryMenuId, setOpenHistoryMenuId] = useState<number | null>(null);
  const [firstName, setFirstName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
const [currentUserName, setCurrentUserName] = useState("Utilisateur");
const [profileMenuOpen, setProfileMenuOpen] = useState(false);
const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

useEffect(() => {
  const loadUser = async () => {
   
const { data } = await supabase.auth.getUser();
const user = data.user;

setCurrentUserEmail(user?.email ?? null);
setCurrentUserName(
  user?.user_metadata?.first_name ||
  user?.user_metadata?.full_name ||
  user?.email?.split("@")[0] ||
  "Utilisateur"
);
  };
  

  loadUser();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    
const user = session?.user;

setCurrentUserEmail(user?.email ?? null);
setCurrentUserName(
  user?.user_metadata?.first_name ||
  user?.user_metadata?.full_name ||
  user?.email?.split("@")[0] ||
  "Utilisateur"
);

  });

  return () => {
    subscription.unsubscribe();
  };
}, []);
useEffect(() => {
  let cancelled = false;

  const loadConversations = async () => {
    if (!currentUserEmail) {
      setConversations([]);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      if (!cancelled) setConversations([]);
      return;
    }

    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, messages")
      .eq("user_id", user.id)
      .order("id", { ascending: false });

    if (error) {
      console.error("Erreur de chargement de l'historique :", error.message);
      return;
    }

    if (!cancelled) {
      setConversations(
        (data ?? []).map((conversation) => ({
          id: conversation.id as number,
          title: conversation.title || "Nouvelle conversation",
          messages: (conversation.messages ?? []) as Message[],
        }))
      );
    }
  };

  void loadConversations();

  return () => {
    cancelled = true;
  };
}, [currentUserEmail]);
 


const handleSignUp = async () => {
  if (!email || !password) {
    alert("Veuillez remplir votre e-mail et votre mot de passe.");
    return;
  }

  setAuthLoading(true);

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
        },
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Compte créé avec succès !");
  } catch {
    alert("Impossible de créer le compte. Réessaie.");
  } finally {
    setAuthLoading(false);
  }
};

const handleSignIn = async () => {
  if (!email || !password) {
    alert("Entre ton adresse e-mail et ton mot de passe.");
    return;
  }

  setAuthLoading(true);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setCurrentUserEmail(data.user?.email ?? null);
    setAuthOpen(false);
    setEmail("");
    setPassword("");

    alert("Connexion réussie !");
  } catch (error) {
    console.error("Erreur de connexion :", error);
    alert("Impossible de se connecter. Réessaie.");
  } finally {
    setAuthLoading(false);
  }
};

const saveConversation = async (
  conversationMessages: Message[],
  currentId: number | null
) => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Utilisateur non connecté.");
    return currentId;
  }

  // Créer une nouvelle conversation
  if (currentId === null) {
    const title =
      conversationMessages.find((m) => m.role === "user")
        ?.content.slice(0, 60) || "Nouvelle conversation";

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title,
        messages: conversationMessages,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Erreur de sauvegarde :", error.message);
      return null;
    }

    const newId = data.id as number;

    setConversationId(newId);
    setConversationTitle(title);

    setConversations((previous) => [
      {
        id: newId,
        title,
        messages: conversationMessages,
      },
      ...previous.filter(
        (conversation) => conversation.id !== newId
      ),
    ]);

    return newId;
  }

  // Mettre à jour une conversation existante
  const { error } = await supabase
    .from("conversations")
    .update({ messages: conversationMessages })
    .eq("id", currentId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erreur de mise à jour :", error.message);
  } else {
    setConversations((previous) => {
      const existing = previous.find(
        (conversation) => conversation.id === currentId
      );

      const updatedConversation = {
        id: currentId,
        title: existing?.title ?? conversationTitle,
        messages: conversationMessages,
      };

      return [
        updatedConversation,
        ...previous.filter(
          (conversation) => conversation.id !== currentId
        ),
      ];
    });
  }

  return currentId;
};
const handleForgotPassword = async () => {
  if (!email) {
    alert("Entre d'abord ton adresse e-mail.");
    return;
  }

  setAuthLoading(true);

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/reset-password",
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      "Un e-mail de récupération vient d'être envoyé à ton adresse."
    );
  } catch {
    alert("Impossible d'envoyer l'e-mail. Réessaie.");
  } finally {
    setAuthLoading(false);
  }
};

  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const activeMode = modes.find((mode) => mode.name === selectedMode) ?? modes[0];

  const newConversation = () => {
  setMessages([]);
  setMessage("");
  setConversationId(null);
  setConversationTitle("Nouvelle conversation");

  if (messageInputRef.current) {
    messageInputRef.current.style.height = "44px";
  }
};

const openConversation = (conversation: {
  id: number;
  title: string;
  messages: Message[];
}) => {
  setConversationId(conversation.id);
  setConversationTitle(conversation.title);
  setMessages(conversation.messages);
  setMessage("");

  if (messageInputRef.current) {
    messageInputRef.current.style.height = "44px";
  }
};
const deleteConversation = async (id: number) => {
  if (!window.confirm("Supprimer cette conversation définitivement ?")) {
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    alert("Connecte-toi pour supprimer cette conversation.");
    return;
  }

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erreur de suppression :", error.message);
    alert("Impossible de supprimer cette conversation.");
    return;
  }

  setConversations((previous) =>
    previous.filter((conversation) => conversation.id !== id)
  );

  setSelectedConversationIds((previous) =>
    previous.filter((selectedId) => selectedId !== id)
  );

  setOpenHistoryMenuId(null);

  if (conversationId === id) {
    setConversationId(null);
    setConversationTitle("Nouvelle conversation");
    setMessages([]);
    setMessage("");
  }
};

const deleteSelectedConversations = async () => {
  if (selectedConversationIds.length === 0) {
    alert("Sélectionne au moins une conversation.");
    return;
  }

  if (
    !window.confirm(
      `Supprimer ${selectedConversationIds.length} conversation(s) définitivement ?`
    )
  ) {
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    alert("Connecte-toi pour supprimer ces conversations.");
    return;
  }

  const idsToDelete = [...selectedConversationIds];

  const { error } = await supabase
    .from("conversations")
    .delete()
    .in("id", idsToDelete)
    .eq("user_id", user.id);

  if (error) {
    console.error("Erreur de suppression multiple :", error.message);
    alert("Impossible de supprimer les conversations sélectionnées.");
    return;
  }

  setConversations((previous) =>
    previous.filter(
      (conversation) => !idsToDelete.includes(conversation.id)
    )
  );

  if (conversationId !== null && idsToDelete.includes(conversationId)) {
    setConversationId(null);
    setConversationTitle("Nouvelle conversation");
    setMessages([]);
    setMessage("");
  }

  setSelectedConversationIds([]);
  setHistorySelectionMode(false);
  setOpenHistoryMenuId(null);
};


const sendMessage = async () => {
  const text = message.trim();
  if (!text || isThinking) return;

  const userMessage: Message = {
    role: "user",
    content: text,
  };

  const previousMessages = [...messages];

  const initialMessages: Message[] = [
    ...previousMessages,
    userMessage,
    {
      role: "assistant",
      content: "",
    },
  ];

  setIsThinking(true);
  setMessages(initialMessages);
  setMessage("");
  setTimeout(() => {
  const messagesContainer = document.querySelector(".messages");
  if (messagesContainer) {
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: "smooth",
    });
  }
}, 50);

  if (messageInputRef.current) {
    messageInputRef.current.style.height = "44px";
  }

  let reply = "";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: text,
        history: previousMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Erreur du serveur.";

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch {
        if (errorText) errorMessage = errorText;
      }

      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("Aucun flux de réponse reçu.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let firstTokenReceived = false;

    const processLine = (line: string) => {
      if (!line.trim()) return;

      const chunk = JSON.parse(line);
      const token = chunk.message?.content ?? "";

      if (token) {
        reply += token;

        if (!firstTokenReceived) {
          firstTokenReceived = true;
          setIsThinking(false);
        }

        setMessages([
          ...previousMessages,
          userMessage,
          {
            role: "assistant",
            content: reply,
          },
        ]);
      }

      if (chunk.error) {
        throw new Error(chunk.error);
      }
    };

    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        processLine(line);
      }
    }

    buffer += decoder.decode();

    if (buffer.trim()) {
      processLine(buffer);
    }

    if (!reply.trim()) {
      throw new Error("Le modèle n'a envoyé aucune réponse.");
    }

    const finalMessages: Message[] = [
      ...previousMessages,
      userMessage,
      {
        role: "assistant",
        content: reply,
      },
    ];

    setMessages(finalMessages);

    const savedId = await saveConversation(
      finalMessages,
      conversationId
    );

    if (savedId !== null) {
      setConversationId(savedId);
    }
  } catch (error) {
    console.error("Erreur pendant la réponse de Kensou :", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Erreur inconnue.";

    setMessages([
      ...previousMessages,
      userMessage,
      {
        role: "assistant",
        content: `Désolé, je n'ai pas pu terminer la réponse. ${errorMessage}`,
      },
    ]);
  } finally {
    setIsThinking(false);
  }
};


  const handleMessageKeyDown = (
    e: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage((prev) =>
      prev.trim() ? `${prev} [${file.name}]` : `[${file.name}]`
    );
  };

  const selectMode = (mode: string) => {
    setSelectedMode(mode);
    setModeOpen(false);
    setPlusOpen(false);
  };

  
   const renderAssistantMessage = (content: string) => {
  const start = content.indexOf("FINAL_ANSWER_START");
  const end = content.indexOf("FINAL_ANSWER_END");

  if (start === -1 || end === -1 || end <= start) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    );
  }

  const demonstration = content.slice(0, start).trim();
  const finalAnswer = content
    .slice(start + "FINAL_ANSWER_START".length, end)
    .trim();

  return (
    <>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {demonstration}
      </ReactMarkdown>

      <div className="final-answer">
        <div className="final-answer-title">Réponse finale</div>

        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {finalAnswer}
        </ReactMarkdown>
      </div>
    </>
  );
};
  return (
  <main className="app">
      <aside
        className={`sidebar ${
          sidebarOpen ? "sidebar-open" : "sidebar-closed"
        }`}
      >
        <div className="sidebar-content">
          <div className="sidebar-brand">
            <img
              src="/kensou-mountain-logo.png"
              alt="Kensou AI"
              className="sidebar-brand-logo"
            />
            <div>
              <div className="sidebar-brand-name">Kensou AI</div>
              <div className="sidebar-brand-subtitle">OPEN SOURCE AI</div>
            </div>
          </div>

          <button className="new-chat" onClick={newConversation}>
            <span className="new-chat-icon">＋</span>
            <span>Nouvelle conversation</span>
          </button>

          <div className="sidebar-separator" />

          <div className="sidebar-section">
            <div className="section-title-row">
              <span className="section-title">Divers</span>
              <button
                className="dots-button"
                onClick={() => setDiversOpen((prev) => !prev)}
                aria-label="Options"
                title="Options"
              >
                ⋯
              </button>
            </div>

            {diversOpen && (
              <div className="divers-menu">
                <button>♪ Générer des musiques</button>
                <button>▧ Générer des photos</button>
                <button>▣ Générer des vidéos</button>
                <button>⌘ Créer des apps</button>
              </div>
            )}
          </div>
<div className="sidebar-section history-section">
  <div className="section-title-row history-title-row">
    <span className="section-title">Historique</span>

    <button
      type="button"
      className={`history-select-button ${
        historySelectionMode ? "active" : ""
      }`}
      onClick={() => {
        setHistorySelectionMode((previous) => !previous);
        setSelectedConversationIds([]);
        setOpenHistoryMenuId(null);
      }}
      aria-label={
        historySelectionMode
          ? "Terminer la sélection"
          : "Sélectionner plusieurs conversations"
      }
      title={
        historySelectionMode
          ? "Terminer la sélection"
          : "Sélection multiple"
      }
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="8" y="3" width="13" height="13" rx="2" />
        <path d="M5 7H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1" />
        <path d="m11 9 2 2 4-4" />
      </svg>
    </button>
  </div>

  {historySelectionMode && selectedConversationIds.length > 0 && (
    <button
      type="button"
      className="history-delete-selected"
      onClick={() => void deleteSelectedConversations()}
    >
      Supprimer ({selectedConversationIds.length})
    </button>
  )}

  {conversations.length === 0 ? (
    <div className="empty-history">Aucune conversation</div>
  ) : (
    <div className="history-list">
      {conversations.map((conversation) => (
        <div
        key={conversation.id}
         className={`history-item-row ${
  conversationId === conversation.id ? "active" : ""
} ${
  openHistoryMenuId === conversation.id ? "menu-open" : ""
}`}
        >
          {historySelectionMode && (
            <input
              type="checkbox"
              className="history-checkbox"
              checked={selectedConversationIds.includes(conversation.id)}
              onChange={(event) => {
                const checked = event.target.checked;

                setSelectedConversationIds((previous) =>
                  checked
                    ? previous.includes(conversation.id)
                      ? previous
                      : [...previous, conversation.id]
                    : previous.filter((id) => id !== conversation.id)
                );
              }}
              aria-label={`Sélectionner ${conversation.title}`}
            />
          )}

          <button
            type="button"
            className="history-item"
            onClick={() => {
              if (historySelectionMode) {
                setSelectedConversationIds((previous) =>
                  previous.includes(conversation.id)
                    ? previous.filter((id) => id !== conversation.id)
                    : [...previous, conversation.id]
                );
              } else {
                openConversation(conversation);
              }
            }}
            title={conversation.title}
          >
            <span className="history-item-title">
              {conversation.title}
            </span>
          </button>

          {!historySelectionMode && (
            <div className="history-item-actions">
              <button
                type="button"
                className="history-menu-button"
               onClick={(event) => {
  event.stopPropagation();
  setOpenHistoryMenuId(conversation.id);
}}
                aria-label={`Options de ${conversation.title}`}
                title="Options"
              >
                ⋯
              </button>
              {openHistoryMenuId === conversation.id && (
                <div className="history-item-menu">
                  <button
                    type="button"
                    onClick={() => void deleteConversation(conversation.id)}
                  >
                    <svg
  width="16"
  height="16"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="1.7"
  strokeLinecap="round"
  strokeLinejoin="round"
  aria-hidden="true"
>
  <path d="M3 6h18" />
  <path d="M8 6V4h8v2" />
  <path d="m19 6-1 14H6L5 6" />
  <path d="M10 10v6" />
  <path d="M14 10v6" />
</svg>
                    <span>Supprimer</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</div>
</div>

<div className="sidebar-bottom">
  {currentUserEmail ? (
    <>
      <button
        type="button"
        className={`profile-button profile-trigger ${
          profileMenuOpen ? "active" : ""
        }`}
        onClick={() => setProfileMenuOpen((previous) => !previous)}
        title="Ouvrir le profil"
        aria-label="Ouvrir le profil"
        aria-expanded={profileMenuOpen}
      >
        <span className="profile-trigger-avatar">
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt="Photo de profil"
              className="profile-avatar"
            />
         ) : (
  <svg
    viewBox="0 0 24 24"
    width="21"
    height="21"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="8.5" cy="9" r="1.5" />
    <path d="m4 17 5-5 3 3 3-4 5 6" />
  </svg>
)}
        </span>

        <span className="profile-name">{currentUserName}</span>
      </button>

      {profileMenuOpen && (
        <div className="profile-menu">
          <div className="profile-menu-header">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Photo de profil"
                className="profile-avatar"
              />
            ) : (
              <span className="profile-avatar-letter">K</span>
            )}

            <div className="profile-menu-user">
              <strong>{currentUserName}</strong>
              <span>{currentUserEmail}</span>
            </div>
          </div>

          <button
            type="button"
            className="profile-menu-item"
            onClick={() => {
              setProfileMenuOpen(false);
              alert("Les paramètres seront ajoutés ensuite.");
            }}
          >
            <span>⚙</span>
            <span>Paramètres</span>
          </button>

          <button
            type="button"
            className="profile-menu-item logout-item"
            onClick={async () => {
              const { error } = await supabase.auth.signOut();

              if (error) {
                alert(error.message);
                return;
              }

              setCurrentUserEmail(null);
              setCurrentUserName("Utilisateur");
              setProfilePhoto(null);
              setProfileMenuOpen(false);
              setConversationId(null);
              setConversationTitle("Nouvelle conversation");
              setMessages([]);
              setMessage("");
              setAuthMode("login");
            }}
          >
            <span>↪</span>
            <span>Se déconnecter</span>
          </button>
        </div>
      )}
    </>
  ) : (
    <button
      type="button"
      className="sidebar-login-button"
      onClick={() => {
        setAuthMode("login");
        setAuthOpen(true);
      }}
    >
      Se connecter
    </button>
  )}
</div>
</aside>
      <section className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="topbar-button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Barre latérale"
              title="Afficher / masquer la barre latérale"
            >
              ☰
            </button>

            <button
              className="topbar-button"
              onClick={() => setSearchOpen((prev) => !prev)}
              aria-label="Rechercher"
              title="Rechercher"
            >
              ⌕
            </button>
          </div>

          <img
            src="/kensou-mountain-logo.png"
            alt="Kensou AI"
            className="top-logo"
          />
<div className="topbar-right">
  <button
    type="button"
    className="topbar-button topbar-new-chat"
    onClick={newConversation}
    aria-label="Nouvelle conversation"
    title="Nouvelle conversation"
  >
    <svg
  viewBox="0 0 24 24"
  width="20"
  height="20"
  fill="none"
  stroke="currentColor"
  strokeWidth="1.7"
  strokeLinecap="round"
  strokeLinejoin="round"
  aria-hidden="true"
>
  <path d="M15 14a6.5 6.5 0 0 1-6.5 6.5H4l-1 1v-5.5A6.5 6.5 0 0 1 9.5 9.5H11" />
  <path d="M6.5 13h4" />
  <circle cx="18" cy="6" r="4" />
  <path d="M18 4v4" />
  <path d="M16 6h4" />
</svg>
  </button>

  <div className="top-online">
    <span className="top-online-dot" />
    <span>En ligne</span>
  </div>
</div>
        </header>
{authOpen && (
  <div className="auth-overlay">
    <div className="auth-box">
      <button
        className="auth-close"
        onClick={() => setAuthOpen(false)}
      >
        ×
      </button>

      <h2>Bienvenue sur Kensou AI</h2>
      <p>Crée ton compte pour commencer.</p>
<div className="social-login">
  <button className="social-button google-button">
    <svg className="social-svg google-svg" viewBox="0 0 24 24" aria-hidden="true">
  <path fill="#4285F4" d="M21.35 12.27c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.22z"/>
  <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.55 0-4.71-1.72-5.49-4.03H3.27v2.53A9.75 9.75 0 0 0 12 21.75z"/>
  <path fill="#FBBC05" d="M6.51 13.83A5.86 5.86 0 0 1 6.2 12c0-.64.11-1.26.31-1.83V7.64H3.27A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.02 4.36l3.24-2.53z"/>
  <path fill="#EA4335" d="M12 6.14c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.83 3.24 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.73 5.39l3.24 2.53C7.29 7.86 9.45 6.14 12 6.14z"/>
</svg>
          <span>Continuer avec Google</span>
  </button>

  <button className="social-button microsoft-button">
    <span className="microsoft-logo">
      <span />
      <span />
      <span />
      <span />
    </span>
    <span>Continuer avec Microsoft</span>
  </button>

  <button className="social-button facebook-button">
    <svg className="social-svg facebook-svg" viewBox="0 0 24 24" aria-hidden="true">
  <path
    fill="currentColor"
    d="M13.6 22v-9h3l.45-3.5H13.6V7.26c0-1.02.28-1.71 1.73-1.71h1.85V2.42c-.32-.04-1.42-.14-2.71-.14-2.68 0-4.52 1.64-4.52 4.65V9.5H7v3.5h2.95v9h3.65z"
  />
</svg>
    <span>Continuer avec Facebook</span>
  </button>
</div>
    
{authMode === "signup" && (
  <input
    type="text"
    placeholder="Prénom"
    value={firstName}
    onChange={(e) => setFirstName(e.target.value)}
  />
)}


<input
  type="email"
  placeholder="Adresse e-mail"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

<input
  type="password"
  placeholder="Mot de passe"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>

      
      {authMode === "login" && (
  <button
    type="button"
    className="forgot-password"
    onClick={handleForgotPassword}
    disabled={authLoading}
  >
    Mot de passe oublié ?
  </button>
)}
  <button
  className="auth-submit"
  onClick={authMode === "signup" ? handleSignUp : handleSignIn}
  disabled={authLoading}
>
  {authLoading
    ? "Chargement..."
    : authMode === "signup"
      ? "Créer mon compte"
      : "Se connecter"}
</button>

     <div className="auth-switch">
  {authMode === "signup" ? (
    <>
      Déjà un compte ?{" "}
      <span onClick={() => setAuthMode("login")}>
        Se connecter
      </span>
    </>
  ) : (
    <>
      Pas encore de compte ?{" "}
      <span onClick={() => setAuthMode("signup")}>
        Créer un compte
      </span>
    </>
  )}
</div>
    </div>
  </div>
)}

        {searchOpen && (
          <div className="search-panel">
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Rechercher dans l'historique..."
              autoFocus
            />
            <div className="search-result">
              {searchValue.trim()
                ? `Aucun résultat pour « ${searchValue} »`
                : "Aucun résultat pour le moment"}
            </div>
          </div>
        )}

        <div className="content">
          {messages.length === 0 ? (
  <div className="welcome">
    <img
      src="/kensou-mountain-logo.png"
      alt="Kensou AI"
      className="welcome-logo"
    />

    <h1>Bonjour, je suis Kensou.</h1>
    <p>On parle de quoi aujourd’hui ?</p>
  </div>
) : (
  <div className="conversation-layout">
    <div
  className="messages"
  onScroll={(event) => {
    const container = event.currentTarget;
    const questionElements =
      container.querySelectorAll<HTMLElement>('[id^="question-"]');

    const containerTop = container.getBoundingClientRect().top;

    let closestQuestion = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    questionElements.forEach((element) => {
      const questionTop =
        element.getBoundingClientRect().top - containerTop;

      const distance = Math.abs(questionTop - 40);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestQuestion =
          Number(element.id.replace("question-", "")) || 0;
      }
    });

    setActiveQuestionIndex(closestQuestion);
  }}
>
      {messages.map((msg, index) => {
        const questionIndex = messages
          .slice(0, index)
          .filter((previousMessage) => previousMessage.role === "user")
          .length;

        return (
          <div
            key={index}
            id={
              msg.role === "user"
                ? `question-${questionIndex}`
                : undefined
            }
            className={`message ${
              msg.role === "user"
                ? "user-message"
                : "assistant-message"
            }`}
          >
            {msg.role === "assistant" ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {msg.content}
              </ReactMarkdown>
            ) : (
              msg.content
            )}
          </div>
        );
      })}

      {isThinking && (
        <div
          className="thinking-indicator"
          role="status"
          aria-label="Kensou réfléchit"
        >
          <span />
          <span />
          <span />
        </div>
      )}
    </div>

    <nav
      className="conversation-navigator"
      aria-label="Navigation dans la conversation"
    >
      {messages
        .filter((msg) => msg.role === "user")
        .map((question, questionIndex) => {
          const title = question.content.trim();
          const shortTitle =
            title.length > 65
              ? `${title.slice(0, 65)}…`
              : title;

          return (
            <button
              key={`question-nav-${questionIndex}`}
              type="button"
              className={`conversation-nav-dot ${
                activeQuestionIndex === questionIndex ? "active" : ""
              }`}
              title={shortTitle}
              aria-label={`Aller à la question ${questionIndex + 1} : ${shortTitle}`}
              onClick={() => {
                const target = document.getElementById(
                  `question-${questionIndex}`
                );

                if (target) {
                  target.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });

                  setActiveQuestionIndex(questionIndex);
                }
              }}
            >
              <span className="sr-only">
                Question {questionIndex + 1}
              </span>
            </button>
          );
        })}
    </nav>
  </div>
)}
          

          <div className="composer-zone">
            {modeOpen && (
              <div className="composer-mode-menu">
                <div className="mode-menu-title">MODES KENSOU</div>
                {modes.map((mode) => (
                  <button
                    type="button"
                    key={mode.name}
                    className={`mode-card ${
                      selectedMode === mode.name ? "active" : ""
                    }`}
                    onClick={() => selectMode(mode.name)}
                  >
                    <span className="mode-icon">
                      <ModeIcon type={mode.icon} />
                    </span>
                    <span className="mode-info">
                      <strong>{mode.name}</strong>
                      <small>{mode.slogan}</small>
                      <em>{mode.description}</em>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {plusOpen && (
              <div className="plus-menu">
                <label className="plus-option">
                  <span>▧</span>
                  <span>Ajouter une image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>

                <label className="plus-option">
                  <span>📎</span>
                  <span>Ajouter un fichier</span>
                  <input type="file" onChange={handleFileChange} />
                </label>
              </div>
            )}

            <div className="composer">
              <button
                type="button"
                className="composer-button plus-button"
                onClick={() => {
                  setPlusOpen((prev) => !prev);
                  setModeOpen(false);
                }}
                aria-label="Ajouter"
                title="Ajouter un fichier ou une image"
                aria-expanded={plusOpen}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>

              <button
              type="button"
                className="composer-mode-selector"
                onClick={() => {
                  setModeOpen((prev) => !prev);
                  setPlusOpen(false);
                }}
                aria-label={`Choisir le mode Kensou, mode actuel : ${selectedMode}`}
                aria-expanded={modeOpen}
                title={`Mode actuel : ${selectedMode}`}
              >
                <span className="composer-mode-icon">
                  <ModeIcon type={activeMode.icon} />
                </span>
                <span className="composer-mode-label">{activeMode.name}</span>
                <svg className="composer-mode-chevron" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="m5 7 5 5 5-5" />
                </svg>
              </button>

              <div className="message-input-wrapper">
                <textarea
                  ref={messageInputRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    e.currentTarget.style.height = "44px";
                    e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 124)}px`;
                  }}
                  onKeyDown={handleMessageKeyDown}
                  placeholder="Pose ta question à Kensou..."
                  rows={1}
                />
              </div>

              <button
                type="button"
                onClick={startLocalWhisper}
                className="composer-button voice-button"
                title={isListening ? "Écoute en cours..." : "Discussion vocale"}
aria-label={isListening ? "Écoute en cours..." : "Discussion vocale"}
              >
                <svg
                  className="voice-svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M3 10v4" />
                  <path d="M7 6v12" />
                  <path d="M11 3v18" />
                  <path d="M15 7v10" />
                  <path d="M19 10v4" />
                  <path d="M22 11v2" />
                </svg>
              </button>

              <button
                type="button"
                className="send-button"
                onClick={sendMessage}
                title={message.trim() ? "Envoyer" : "Écris un message pour envoyer"}
                aria-label="Envoyer"
                disabled={!message.trim()}
              >
                ➤
              </button>
            </div>

            <div className="composer-note">
              Kensou peut faire des erreurs. Vérifie les informations importantes.
            </div>
          </div>
        </div>
      </section>
    
</main>
);
}
