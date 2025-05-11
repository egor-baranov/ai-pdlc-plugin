import React, {useState, useRef, useEffect, useReducer} from "react";
import {
    ArrowUp,
    Paperclip,
    ChevronUp,
    ChevronDown,
    WandSparkles,
    ArrowLeft,
    Trash2,
    LucideEdit
} from "lucide-react";

// Types
interface UserMessage {
    role: "user";
    content: string;
}

interface AssistantMessage {
    role: "assistant";
    content: { title: string; body: string; };
}

type MessageType = UserMessage | AssistantMessage;

type ViewEvent = { type: "newSession" } | { type: "chatList" } | { type: "settings" };

interface ChatSession {
    id: number;
    title: string;
    messages: MessageType[];
}

interface State {
    sessions: ChatSession[];
    activeSessionId: number;
    expanded: Set<number>;
    activeView: "chat" | "list" | "settings";
}

type Action =
    | { type: "ADD_USER"; text: string }
    | { type: "ADD_ASSISTANT"; title: string; body: string }
    | { type: "TOGGLE"; index: number }
    | { type: "EVENT"; event: ViewEvent }
    | { type: "SWITCH_SESSION"; sessionId: number }
    | { type: "DELETE_SESSION"; sessionId: number }
    | { type: "EDIT_SESSION"; sessionId: number; newTitle: string };

const initial: State = {
    sessions: [
        {id: 1, title: "Chat 1", messages: []}
    ],
    activeSessionId: 1,
    expanded: new Set(),
    activeView: "chat"
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "ADD_USER": {
            const sessions = state.sessions.map(s => {
                if (s.id === state.activeSessionId) {
                    const userMsg: UserMessage = {role: "user", content: action.text};
                    return {...s, messages: [...s.messages, userMsg]};
                }
                return s;
            });
            return {...state, sessions};
        }
        case "ADD_ASSISTANT": {
            const sessions = state.sessions.map(s => {
                if (s.id === state.activeSessionId) {
                    const assistantMsg: AssistantMessage = {
                        role: "assistant",
                        content: {title: action.title, body: action.body}
                    };
                    return {...s, messages: [...s.messages, assistantMsg]};
                }
                return s;
            });
            return {...state, sessions};
        }
        case "TOGGLE": {
            const newSet = new Set(state.expanded);
            newSet.has(action.index) ? newSet.delete(action.index) : newSet.add(action.index);
            return {...state, expanded: newSet};
        }
        case "EVENT": {
            if (action.event.type === "newSession") {
                const newId = state.sessions.length + 1;
                const newSession: ChatSession = {id: newId, title: `Chat ${newId}`, messages: []};
                return {
                    ...state,
                    sessions: [...state.sessions, newSession],
                    activeSessionId: newId,
                    activeView: "chat"
                };
            }
            if (action.event.type === "chatList") {
                return {...state, activeView: "list"};
            }
            if (action.event.type === "settings") {
                return {...state, activeView: "settings"};
            }
            return state;
        }
        case "SWITCH_SESSION":
            return {...state, activeSessionId: action.sessionId, activeView: "chat"};
        case "DELETE_SESSION": {
            const filtered = state.sessions.filter(s => s.id !== action.sessionId);
            const newActive = filtered.length ? filtered[0].id : 0;
            return {
                ...state,
                sessions: filtered,
                activeSessionId: newActive,
                activeView: filtered.length ? state.activeView : "list"
            };
        }
        case "EDIT_SESSION": {
            const sessions = state.sessions.map(s =>
                s.id === action.sessionId ? {...s, title: action.newTitle} : s
            );
            return {...state, sessions};
        }
        default:
            return state;
    }
}

function App() {
    const [state, dispatch] = useReducer(reducer, initial);
    const [input, setInput] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState("");
    const endRef = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState<"chat" | "studio">("chat");

    useEffect(() => {
        const handler = (e: MessageEvent) => {
            const msg = e.data as ViewEvent;
            if (msg && msg.type) dispatch({type: "EVENT", event: msg});
        };
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, []);

    useEffect(() => {
        endRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [state.sessions.find(s => s.id === state.activeSessionId)?.messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        dispatch({type: "ADD_USER", text: input});
        setInput("");
        setTimeout(() => {
            dispatch({type: "ADD_ASSISTANT", title: "Generating...", body: "Loading..."});
        }, 500);
    };

    // Chat List View
    if (state.activeView === "list") {
        return (
            <div className="p-4 bg-[#1e1e1e] h-screen text-white">
                <h2 className="text-xl mb-4">Chats</h2>
                <ul className="space-y-2">
                    {state.sessions.map(s => (
                        <li key={s.id}>
                            <div
                                className={`flex items-center justify-between p-3 rounded hover:bg-gray-700 ${s.id === state.activeSessionId ? 'bg-gray-600' : ''}`}>
                                {editingId === s.id ? (
                                    <input
                                        className="flex-1 p-2 bg-gray-700 rounded mr-2"
                                        value={editText}
                                        onChange={e => setEditText(e.target.value)}
                                    />
                                ) : (
                                    <button
                                        className="flex-1 text-left"
                                        onClick={() => dispatch({type: "SWITCH_SESSION", sessionId: s.id})}
                                    >
                                        {s.title} ({s.messages.length})
                                    </button>
                                )}
                                <div className="flex items-center gap-2">
                                    {editingId === s.id ? (
                                        <button onClick={() => {
                                            dispatch({
                                                type: "EDIT_SESSION",
                                                sessionId: s.id,
                                                newTitle: editText || s.title
                                            });
                                            setEditingId(null);
                                        }}>
                                            <ArrowUp size={20}/>
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={() => {
                                                setEditingId(s.id);
                                                setEditText(s.title);
                                            }}>
                                                <LucideEdit size={16}/>
                                            </button>
                                            <button onClick={() => dispatch({type: "DELETE_SESSION", sessionId: s.id})}>
                                                <Trash2 size={16}/>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    // Settings View
    if (state.activeView === "settings") {
        return (
            <div className="p-4 bg-[#1e1e1e] h-screen text-white">
                <h2 className="text-xl mb-4">Settings</h2>
                <div className="space-y-2">
                    <label className="flex items-center">
                        <input type="checkbox" className="mr-2"/> Enable feature X
                    </label>
                    <label className="flex items-center">
                        <input type="checkbox" className="mr-2"/> Enable feature Y
                    </label>
                </div>
            </div>
        );
    }

    // Chat View
    const current = state.sessions.find(s => s.id === state.activeSessionId)!;

    return (
        <div className="flex flex-col h-screen p-3 bg-[#1e1e1e] text-white overflow-hidden">
            <div className="flex items-center mb-2">
                <button
                    className="mr-2 px-2 py-1 rounded"
                    onClick={() => dispatch({type: "EVENT", event: {type: "chatList"}})}
                >
                    <ArrowLeft size={16}/>
                </button>
                <h2 className="text-lg">{current.title}</h2>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 flex flex-col">
                {current.messages.map((msg, idx) => (
                    <div key={idx} className={`px-4 py-2 rounded-lg whitespace-pre-wrap break-words ${
                        msg.role === "user"
                            ? "bg-blue-600 self-end text-right max-w-[50%]"
                            : "bg-gray-700 self-start max-w-full"
                    }`}>
                        {msg.role === "user" ? msg.content : (
                            <>
                                <div
                                    className="flex justify-between cursor-pointer gap-1 hover:bg-gray-600/30 rounded p-1 -m-1 transition-colors"
                                    onClick={() => dispatch({type: "TOGGLE", index: idx})}
                                >
                                    <span className="font-semibold">{msg.content.title}</span>
                                    {state.expanded.has(idx) ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                </div>
                                {state.expanded.has(idx) &&
                                    <div className="mt-2 pt-2 border-t border-gray-600">{msg.content.body}</div>}
                            </>
                        )}
                    </div>
                ))}
                <div ref={endRef}/>
            </div>

            <div className="relative mt-3">
                <input
                    className="w-full pt-4 pb-12 pl-4 pr-24 rounded-2xl bg-[#2c2c2c] text-white placeholder-gray-400 focus:outline-none text-sm"
                    placeholder="Ask GigaStudio to build..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <div className="absolute left-0.5 bottom-1 flex items-center gap-0">
                    <button
                        className="bg-gray-600 py-1 rounded-full scale-[0.7] hover:bg-gray-500 text-lg w-20"
                        onClick={() => setMode(mode === "chat" ? "studio" : "chat")}
                        title="Toggle Chat/Studio"
                    >
                        {mode === "chat" ? "Studio" : "Chat"}
                    </button>
                </div>
                <div className="absolute right-1 bottom-1 flex items-center gap-0">
                    <button className="bg-gray-600 p-2 rounded-full scale-[0.7] hover:bg-gray-500" title="Magic">
                        <WandSparkles size={20}/>
                    </button>
                    <button className="bg-gray-600 p-2 rounded-full scale-[0.7] hover:bg-gray-500"
                            title="Attach file">
                        <Paperclip size={20}/>
                    </button>
                    <button
                        onClick={handleSend}
                        className="bg-blue-600 p-2 rounded-full scale-[0.7] hover:bg-blue-700"
                        title="Send message"
                    >
                        <ArrowUp size={20}/>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;