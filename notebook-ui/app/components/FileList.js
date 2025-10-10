import React from "react";

const FileList = ({ selectedFile }) => {
  if (!selectedFile) {
    return <div className="p-8">Select a file to see its content.</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">{selectedFile.name}</h2>
      <div className="bg-white p-4 shadow rounded-lg">
        <p>
          This is a placeholder for displaying the extracted content or notes
          from the uploaded file.
        </p>
      </div>
    </div>
  );
};

export default FileList;
