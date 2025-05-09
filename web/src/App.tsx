import React, { useState, useRef, useEffect } from "react";
import {ArrowUp, Paperclip, ChevronUp, ChevronDown, WandSparkles} from "lucide-react";

type MessageType =
    | {
    role: "user";
    content: string;
}
    | {
    role: "assistant";
    content: {
        title: string;
        body: string;
    };
};

function App() {
    const [messages, setMessages] = useState<MessageType[]>([
        {
            role: "user",
            content: "simple neobank website"
        },
        {
            role: "assistant",
            content: {
                title: "Generated 426 lines",
                body: "Loading..."
            }
        },
    ]);
    const [input, setInput] = useState("");
    const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());
    const endRef = useRef<HTMLDivElement>(null);

    const toggleCollapse = (idx: number) => {
        const newCollapsed = new Set(expandedIndices);
        newCollapsed.has(idx) ? newCollapsed.delete(idx) : newCollapsed.add(idx);
        setExpandedIndices(newCollapsed);
    };

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages(prev => [...prev, { role: "user", content: input }]);
        setInput("");
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: "assistant",
                content: {
                    title: "Generating...",
                    body: `Loading...`
                }
            }]);
        }, 500);
    };

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-screen p-3 bg-[#1e1e1e] text-white overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 flex flex-col">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`px-4 py-2 rounded-lg whitespace-pre-wrap break-words ${
                            msg.role === "user"
                                ? "bg-blue-600 self-end text-right max-w-[50%]"
                                : "bg-gray-700 self-start max-w-full"
                        }`}
                    >
                        {msg.role === "user" ? (
                            msg.content
                        ) : (
                            <>
                                <div
                                    className="flex justify-between cursor-pointer gap-1 hover:bg-gray-600/30 rounded p-1 -m-1 transition-colors"
                                    onClick={() => toggleCollapse(idx)}
                                >
                                    <span className="font-semibold">{msg.content.title}</span>

                                    {!expandedIndices.has(idx) ? (
                                        <ChevronDown size={16} className="text-white flex-shrink-0"/>
                                    ) : (
                                        <ChevronUp size={16} className="text-white flex-shrink-0"/>
                                    )}
                                </div>
                                {expandedIndices.has(idx) && (
                                    <div className="mt-2 pt-2 border-t border-gray-600">
                                        {msg.content.body}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))}
                <div ref={endRef}></div>
            </div>

            <div className="relative mt-3">
                <input
                    className="w-full py-6 pl-4 pr-24 rounded-2xl bg-[#2c2c2c] text-white placeholder-gray-400 focus:outline-none text-sm"
                    placeholder="Ask GigaStudio to build..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <div className="absolute right-1 bottom-1 flex items-center gap-0">
                    <button
                        className="bg-gray-600 p-2 rounded-full scale-[0.7] hover:bg-gray-500"
                        title="Attach file"
                    >
                        <WandSparkles className="text-purple-500" size={24}/>
                    </button>
                    <button
                        className="bg-gray-600 p-2 rounded-full scale-[0.7] hover:bg-gray-500"
                        title="Attach file"
                    >
                        <Paperclip size={24} className="text-white"/>
                    </button>
                    <button
                        onClick={handleSend}
                        className="bg-blue-600 p-2 rounded-full scale-[0.7] hover:bg-blue-700"
                        title="Send message"
                    >
                        <ArrowUp size={24} className="text-white"/>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;