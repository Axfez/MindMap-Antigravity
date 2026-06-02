import { Handle, Position } from "reactflow";
import { useState } from "react";
import "./ChatNode.css";

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-block-lang">{language || "code"}</span>
        <button className="code-block-copy" onClick={handleCopy}>
          {copied ? "COPIADO!" : "COPIAR"}
        </button>
      </div>
      <pre className="code-block-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function ChatNode({ data }) {
  const [inputVal, setInputVal] = useState("");

  const handleMain = () => {
    if (!inputVal.trim()) return;
    data.onMain(data.id, inputVal);
    setInputVal("");
  };

  const handleBranch = () => {
    if (!inputVal.trim()) return;
    data.onBranch(data.id, inputVal);
    setInputVal("");
  };

  const renderAnswer = (text) => {
    if (!text) return null;

    // Split text by markdown code blocks (e.g. ```javascript\nconsole.log("hello");\n```)
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/);
        const language = match ? match[1] : '';
        const code = match ? match[2] : part.slice(3, -3);

        return <CodeBlock key={index} language={language} code={code.trim()} />;
      } else {
        const paragraphs = part.split(/\n\n+/);
        return paragraphs.map((pText, pIdx) => {
          if (!pText.trim()) return null;

          // Split inline code (e.g. `const x = 1;`)
          const inlineParts = pText.split(/(`[^`\n]+`)/g);
          const content = inlineParts.map((subPart, subIdx) => {
            if (subPart.startsWith('`') && subPart.endsWith('`')) {
              return <code key={subIdx} className="inline-code">{subPart.slice(1, -1)}</code>;
            }
            return subPart;
          });

          return <p key={`${index}-${pIdx}`} className="text-paragraph">{content}</p>;
        });
      }
    });
  };

  return (
    <div className="chat-node">
      {!data.isRoot && <Handle type="target" position={Position.Top} className="handle-top" />}
      
      {data.isRoot ? (
        <div className="chat-content root-node">
          <h3>🧠 ¿Qué deseas aprender hoy?</h3>
          <p>Ingresa un tema para comenzar el mapa mental.</p>
        </div>
      ) : (
        <div className="chat-content">
          <div className="question">
            <strong>Pregunta:</strong> {data.question}
          </div>
          <div className="answer nowheel nodrag nopan">
            {renderAnswer(data.answer)}
          </div>
        </div>
      )}
      
      {(data.isRoot ? !data.hasMain : (!data.hasMain || !data.hasBranch)) && (
        <div className="interactions">
          <input 
            type="text" 
            placeholder="Escribe tu pregunta..." 
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") {
                if (!data.hasMain) handleMain();
                else if (!data.hasBranch && !data.isRoot) handleBranch();
              }
            }}
          />
          <div className="buttons">
            {!data.hasMain && <button className="btn-main" onClick={handleMain}>MAIN ↓</button>}
            {!data.isRoot && !data.hasBranch && <button className="btn-branch" onClick={handleBranch}>BRANCH →</button>}
          </div>
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} id="main" className="handle-bottom" />
      {!data.isRoot && <Handle type="source" position={Position.Right} id="branch" className="handle-right" />}
    </div>
  );
}


