import React from "react";

import Editor
from "@monaco-editor/react";

export default function CodeEditor() {

  return (

    <div className="editor-v15">

      <Editor
        height="320px"
        defaultLanguage="javascript"
        defaultValue="// SHIL"
        theme="vs-dark"
      />

    </div>

  );
}
