import React, { useState } from "react";

const Sidebar = ({ onUpload, uploadedFiles, onSelectFile }) => {
  const [isUploading, setIsUploading] = useState(false); // Track upload state
  const [uploadInfo, setUploadInfo] = useState(null); // Additional information about uploaded file

  const handleFileChange = async (event) => {
    if (event.target.files[0]) {
      const file = event.target.files[0];
      setIsUploading(true); // Start spinner
      setUploadInfo(`Uploading "${file.name}" (${(file.size / 1024).toFixed(2)} KB)`); // Show file details

      try {
        await onUpload(file); // Upload file to backend
        setUploadInfo(null); // Clear upload info on success
      } catch (error) {
        setUploadInfo("Upload failed. Please try again."); // Error message
      } finally {
        setIsUploading(false); // Stop spinner
      }
    }
  };

  return (
    <div className="w-72 bg-white h-screen p-6 shadow-lg flex flex-col">
      {/* Header Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">NotebookLM</h2>
        <p className="text-sm text-gray-500">Your AI-enhanced notebook</p>
      </div>

      {/* Upload File Section */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload a File:
        </label>
        <div className="relative group">
          <input
            type="file"
            onChange={handleFileChange}
            id="file-upload"
            className="hidden" // Hide the default file input
          />
          <label
            htmlFor="file-upload"
            className="block w-full px-4 py-3 bg-blue-500 text-white text-center text-sm font-medium rounded-lg shadow-lg cursor-pointer hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-300 transition-all"
          >
            {isUploading ? "Uploading..." : "Click to Upload"}
          </label>
        </div>

        {/* Spinner and Upload Info */}
        {isUploading && (
          <div className="mt-3 flex items-center gap-2">
            <div className="w-5 h-5 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">{uploadInfo}</p>
          </div>
        )}
      </div>

      {/* Uploaded Files List */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Uploaded Files</h3>
        {uploadedFiles.length > 0 ? (
          <ul className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-3 bg-gray-100 rounded-lg shadow cursor-pointer hover:bg-blue-100 transition"
                onClick={() => onSelectFile(file)} // Select file on click
              >
                <span className="text-gray-800 truncate">{file.name}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No files uploaded yet.</p>
        )}
      </div>

      
    </div>
  );
};

export default Sidebar;
