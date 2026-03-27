import { Handle, Position } from "reactflow";
import { useState } from "react";
import "./ChatNode.css";

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

  return (
    <div className="chat-node">
      <Handle type="target" position={Position.Top} className="handle-top" />
      
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
            {data.answer}
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
      <Handle type="source" position={Position.Right} id="branch" className="handle-right" />
    </div>
  );
}
