"use client";
import React, { useState, useRef, useEffect } from "react";
import Message from "./Message";

const Chat = ({ onQuery, isFileUploaded }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Track loading state
  const chatContainerRef = useRef(null); // Reference for chat container

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add the user's message to the chat
    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);

    // Clear the input field immediately
    setInput("");

    setIsLoading(true); // Set loading state
    try {
      // Add a temporary skeleton message for the AI response
      const skeletonMessage = { text: "AI is generating a response...", sender: "bot", isSkeleton: true };
      setMessages((prev) => [...prev, skeletonMessage]);

      // Send the query to the backend and get the response
      const response = await onQuery(input);

      // Replace the skeleton message with the actual AI response
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          text: response.response || "I couldn't process your query.",
          sender: "bot",
          docs: response.retrieved_docs || [], // Pass retrieved docs for bot
        };
        return newMessages;
      });
    } catch (error) {
      // Replace the skeleton message with an error message
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { text: "Error fetching response.", sender: "bot" };
        return newMessages;
      });
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll to the bottom of the chat on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div
        className="flex-1 overflow-y-auto p-6 bg-gray-50"
        ref={chatContainerRef} // Attach ref to the container
      >
        {messages.map((msg, index) => (
          <Message
            key={index}
            text={msg.text}
            sender={msg.sender}
            docs={msg.docs} // Pass retrieved docs to the Message component
            isSkeleton={msg.isSkeleton} // Indicate if the message is a skeleton
          />
        ))}
      </div>

      {/* Input Field */}
      <div className="p-4 bg-white border-t sticky bottom-0">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown} // Handle "Enter" key
            placeholder="Type your message..."
            className={`flex-1 p-4 text-lg border rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300 ${
              isFileUploaded ? "" : "bg-gray-100 cursor-not-allowed"
            }`}
            disabled={!isFileUploaded || isLoading} // Disable input when no file is uploaded or loading
          />
          <button
            onClick={handleSend}
            className={`px-6 py-3 text-lg rounded-lg shadow-md ${
              isFileUploaded && !isLoading
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!isFileUploaded || isLoading} // Disable button when no file is uploaded or loading
          >
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
