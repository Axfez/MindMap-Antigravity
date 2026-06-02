import { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  useEdgesState,
  useNodesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ChatNode } from './components/ChatNode';
import { askGemini, hasApiKey, saveApiKey, testApiKey } from './services/gemini';
import './App.css';

const nodeTypes = { chatNode: ChatNode };

export default function App() {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(!hasApiKey());
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [keyError, setKeyError] = useState("");
  
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: "root",
      type: "chatNode",
      position: { x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 100 },
      data: { isRoot: true }
    }
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(false);

  const onMain = async (parentId, question) => {
    await createChildNode(parentId, question, "main");
  };

  const onBranch = async (parentId, question) => {
    await createChildNode(parentId, question, "branch");
  };

  const nodesWithHandlers = nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      id: n.id,
      onMain,
      onBranch
    }
  }));

  const createChildNode = async (parentId, question, direction) => {
    setIsLoading(true);
    try {
      const answer = await askGemini(question);
      
      const newId = `node_${Date.now()}`;
      
      // Calculate dynamic position to avoid overlaps (basic grid layout)
      // Actually we'll just read from state the current nodes length maybe, but to be simple:
      setNodes((nds) => {
        const parentNode = nds.find(n => n.id === parentId);
        
        let xOff = 0;
        let yOff = 0;
        
        if (direction === "branch") {
          xOff = 450;
        } else if (direction === "main") {
          yOff = 500;
        }
        
        let newX = parentNode.position.x + xOff;
        let newY = parentNode.position.y + yOff;

        const newNode = {
          id: newId,
          type: "chatNode",
          position: { x: newX, y: newY },
          data: { question, answer }
        };

        const updatedNodes = nds.map(n => {
          if (n.id === parentId) {
            return {
              ...n,
              data: {
                ...n.data,
                ...(direction === "main" ? { hasMain: true } : { hasBranch: true })
              }
            };
          }
          return n;
        });

        return [...updatedNodes, newNode];
      });

      setEdges((eds) => [
        ...eds,
        {
          id: `e_${parentId}_${newId}`,
          source: parentId,
          target: newId,
          sourceHandle: direction,
          animated: true,
          style: { stroke: direction === "main" ? "#00ff66" : "#00aa33", strokeWidth: 2 },
          markerEnd: { 
            type: MarkerType.ArrowClosed,
            color: direction === "main" ? "#00ff66" : "#00aa33",
          }
        }
      ]);

    } catch (e) {
      alert("Error generating response. Please check your API key or network.\n" + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (showApiKeyDialog) {
    return (
      <div className="api-key-dialog">
        <div className="api-key-box">
          <div className="logo">🧠</div>
          <h2>Configurar Gemini AI</h2>
          <p>Ingresa tu API Key de Gemini para comenzar a usar el mapa mental.</p>
          <input 
            type="password" 
            value={apiKeyInput}
            onChange={(e) => { setApiKeyInput(e.target.value); setKeyError(""); }}
            placeholder="AIzaSy..."
            autoFocus
          />
          {keyError && <p style={{color: '#ff6b6b', margin: '10px 0', fontSize: '13px'}}>{keyError}</p>}
          <button 
            disabled={isVerifyingKey}
            onClick={async () => {
            if (apiKeyInput.trim()) {
              setIsVerifyingKey(true);
              setKeyError("");
              const isValid = await testApiKey(apiKeyInput.trim());
              setIsVerifyingKey(false);
              
              if (isValid) {
                saveApiKey(apiKeyInput.trim());
                setShowApiKeyDialog(false);
              } else {
                setKeyError("La API Key ingresada es inválida o no tiene permisos.");
              }
            }
          }}>{isVerifyingKey ? "Verificando..." : "Comenzar la experiencia"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Visualizando conocimiento...</p>
        </div>
      )}
      <ReactFlow
        nodes={nodesWithHandlers}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={4}
      >
        <Background color="rgba(0, 255, 102, 0.08)" gap={20} size={1.5} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
