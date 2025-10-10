import React, { useState } from "react";
import { FaRobot } from "react-icons/fa"; // Bot Avatar Icon

const Message = ({ text, sender, docs, isSkeleton }) => {
  const isUser = sender === "user";

  // Skeleton loader for AI response
  if (isSkeleton) {
    return (
      <div className="flex justify-start mb-6 items-start">
        {/* Bot Avatar */}
        <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0 mr-4 flex items-center justify-center">
          <FaRobot className="text-gray-700 text-xl" />
        </div>
        <div className="rounded-xl p-8 w-96 bg-gray-100 animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4"></div>
          <div className="h-6 bg-gray-300 rounded mb-4"></div>
          <div className="h-6 bg-gray-300 rounded mb-4"></div>
          <div className="h-6 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  // Clean up and format bot response text
  const cleanedText = () => {
    let formattedText = text || "";

    // Remove unnecessary markers
    formattedText = formattedText.replace(
      "================================== Ai Message ==================================",
      ""
    );

    // Remove leading and trailing newlines
    formattedText = formattedText.replace(/^\n+/, "").replace(/\n+$/, "");

    // Replace Markdown-style bold with strong HTML tags
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Replace newline characters with HTML line breaks
    formattedText = formattedText.replace(/\n/g, "<br>");

    return formattedText.trim();
  };

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      } mb-6 items-start`}
    >
      {/* Bot Avatar */}
      {!isUser && (
        <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0 mr-4 flex items-center justify-center">
          <FaRobot className="text-gray-700 text-xl" />
        </div>
      )}

      {/* Chat Bubble */}
      <div
        className={`rounded-xl p-6 max-w-2xl text-base shadow-md ${
          isUser
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-100 text-gray-800 rounded-bl-none"
        }`}
      >
        {/* Main Text */}
        <p dangerouslySetInnerHTML={{ __html: cleanedText() }}></p>

        {/* Relevant Documents Section */}
        {!isUser && docs && docs.length > 0 && (
          <div className="mt-4 border-t border-gray-300 pt-3">
            <p className="text-sm font-semibold text-gray-600">
              Relevant Documents:
            </p>
            <ul className="list-disc ml-5 space-y-2">
              {docs.map((doc, index) => (
                <RelevantDoc key={index} doc={doc} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// RelevantDoc Component for Handling "See More" Functionality
const RelevantDoc = ({ doc }) => {
  const [showFullContent, setShowFullContent] = useState(false);

  const handleToggle = () => {
    setShowFullContent((prev) => !prev);
  };

  return (
    <li className="text-sm text-gray-600">
      <p className="font-semibold">Content:</p>
      <p>
        {showFullContent ? doc.content : `${doc.content.slice(0, 150)}...`}
        {doc.content.length > 150 && (
          <button
            onClick={handleToggle}
            className="ml-2 text-blue-500 underline hover:text-blue-700"
          >
            {showFullContent ? "See less" : "See more"}
          </button>
        )}
      </p>
      <p className="text-gray-500">
        <strong>Source:</strong> {doc.metadata.source}, Page {doc.metadata.page}
      </p>
    </li>
  );
};

export default Message;
