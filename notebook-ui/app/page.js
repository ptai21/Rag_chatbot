"use client";
import React, { useState } from "react";
import Sidebar from "./components/SideBar";
import Chat from "./components/Chat";
import { uploadFileToBackend } from "./hooks/uploadFile"; // Import API functions
import { sendQueryToBackend } from "./hooks/sendQuery";

export default function Home() {
  const [uploadedFiles, setUploadedFiles] = useState([]); // Track uploaded files
  const [selectedFile, setSelectedFile] = useState(null); // Track selected file
  const [isFileUploaded, setIsFileUploaded] = useState(false); // Track if a file has been uploaded

  // Handle file upload
  const handleUpload = async (file) => {
    try {
      const response = await uploadFileToBackend(file); // Upload file to backend
      if (response) {
        setUploadedFiles((prevFiles) => [...prevFiles, { name: file.name }]);
        setIsFileUploaded(true); // Mark file as uploaded
        setSelectedFile({ name: file.name }); // Set the uploaded file as selected
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    }
  };

  // Handle query
  const handleQuery = async (query) => {
    if (!isFileUploaded) {
      alert("Please upload a file before chatting.");
      return;
    }

    try {
      return await sendQueryToBackend(query); // Send query to backend
    } catch (error) {
      console.error("Error sending query:", error);
      alert("Failed to process query. Please try again.");
      return { response: "Error processing query." };
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 h-screen fixed left-0 top-0">
        <Sidebar
          onUpload={handleUpload}
          uploadedFiles={uploadedFiles} // Pass the file list
          onSelectFile={setSelectedFile} // Callback for selecting a file
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 ml-72 bg-gray-50 flex flex-col">
        {/* Selected File Display */}
        {/* <div className="p-4 border-b bg-white">
          {selectedFile ? (
            <div>
              <h3 className="text-lg font-semibold">Selected File:</h3>
              <p className="text-gray-600">{selectedFile.name}</p>
            </div>
          ) : (
            <p className="text-gray-500">No file selected</p>
          )}
        </div> */}

        {/* Chat Component */}
        <div className="flex-1 overflow-y-auto">
          <Chat onQuery={handleQuery} isFileUploaded={isFileUploaded} />
        </div>
      </div>
    </div>
  );
}
