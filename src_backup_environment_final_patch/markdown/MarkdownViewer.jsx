import React from "react";

import ReactMarkdown
from "react-markdown";

import remarkGfm
from "remark-gfm";

import rehypeHighlight
from "rehype-highlight";

import "highlight.js/styles/github-dark.css";

export default function MarkdownViewer({
  content = ""
}) {

  return (

    <div className="markdown-v15">

      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >

        {content}

      </ReactMarkdown>

    </div>

  );
}
