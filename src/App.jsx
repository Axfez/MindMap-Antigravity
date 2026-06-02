import { useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useEdgesState,
  useNodesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ChatNode } from './components/ChatNode';
import { getProviders, getCurrentProvider, getCurrentModel, setCurrentModel, setProvider, hasApiKey, saveApiKey, testApiKey, ask } from './services/aiService';
import './App.css';

const nodeTypes = { chatNode: ChatNode };

const providerList = getProviders();
const initialProvider = getCurrentProvider();

export default function App() {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(!hasApiKey());
  const [selectedProviderId, setSelectedProviderId] = useState(initialProvider.id);
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [keyError, setKeyError] = useState("");

  const [selectedModel, setSelectedModel] = useState(getCurrentModel());

  const handleModelChange = (e) => {
    const modelId = e.target.value;
    setSelectedModel(modelId);
    setCurrentModel(modelId);
  };
  
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

  const handleProviderChange = (id) => {
    setSelectedProviderId(id);
    setApiKeyInput("");
    setKeyError("");
    setProvider(id);
    setSelectedModel(getCurrentModel());
  };

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
      const answer = await ask(question);
      
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
          style: { stroke: direction === "main" ? "#4facfe" : "#764ba2", strokeWidth: 2 },
          markerEnd: { 
            type: MarkerType.ArrowClosed,
            color: direction === "main" ? "#4facfe" : "#764ba2",
          }
        }
      ]);

    } catch (e) {
      alert("Error generating response. Please check your API key or network.\n" + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const currentProviderInfo = providerList.find(p => p.id === selectedProviderId);

  if (showApiKeyDialog) {
    return (
      <div className="api-key-dialog">
        <div className="api-key-box">
          <div className="logo">🧠</div>
          <h2>Configurar {currentProviderInfo.name} AI</h2>
          <p>Ingresa tu API Key de {currentProviderInfo.name} para comenzar a usar el mapa mental.</p>
          <div className="provider-selector">
            {providerList.map(p => (
              <button
                key={p.id}
                className={`provider-option ${selectedProviderId === p.id ? 'active' : ''}`}
                onClick={() => handleProviderChange(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="model-selector">
            <label className="model-label">Modelo</label>
            <select className="model-select" value={selectedModel} onChange={handleModelChange}>
              {currentProviderInfo.models.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <input 
            type="password" 
            value={apiKeyInput}
            onChange={(e) => { setApiKeyInput(e.target.value); setKeyError(""); }}
            placeholder={currentProviderInfo.keyPrefix}
            autoFocus
          />
          {keyError && <p style={{color: '#ff6b6b', margin: '10px 0', fontSize: '13px'}}>{keyError}</p>}
          <button 
            disabled={isVerifyingKey}
            onClick={async () => {
            if (apiKeyInput.trim()) {
              setIsVerifyingKey(true);
              setKeyError("");
              setProvider(selectedProviderId);
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
      <button className="settings-btn" onClick={() => setShowApiKeyDialog(true)} title="Cambiar proveedor AI">⚙️</button>
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
        <Background color="rgba(255,255,255,0.05)" gap={20} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
