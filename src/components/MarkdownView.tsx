import React from 'react';
import Markdown from 'react-markdown';

interface MarkdownViewProps {
  content: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  return (
    <div className="markdown-body">
      <Markdown>{content}</Markdown>
    </div>
  );
};
