// src/App.tsx
import { useRef, useState } from 'react'
import { ExcalidrawCanvas, ExcalidrawCanvasRef } from './components/ExcalidrawCanvas'
import { Toolbar } from './components/Toolbar'
import { PropertiesPanel } from './components/PropertiesPanel'
import { Footer } from './components/Footer'
import { useExcalidrawState } from './hooks/useExcalidrawState'
import { CollaborationProvider, PresenceProvider } from './collaboration'
import { generateUserId, generateUserColor } from './collaboration'
import { ConnectionStatus } from './components/ConnectionStatus'
import './styles/excalidraw.css'
import { AppState } from './types/excalidraw'

// Generate user info
const userId = generateUserId()
const userName = `User ${userId.slice(-4)}`
const userColor = generateUserColor()

function AppContent() {
  const {
    elements,
    appState,
    updateAppState,
    clearCanvas,
    addElement,
    updateElement,
    deleteElements,
    undo,
    redo,
    canUndo,
    canRedo,
    setCanvasAppRef,
    setElementsFromCanvas,
  } = useExcalidrawState()

  const canvasRef = useRef<ExcalidrawCanvasRef>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const handleToolChange = (tool: string) => {
    updateAppState({ activeTool: tool as any })
  }

  const handleToggleToolLock = () => {
    updateAppState({ isToolLocked: !appState.isToolLocked })
  }

  const handleClear = () => {
    clearCanvas()
    canvasRef.current?.clearCanvas()
  }

  const handleExport = () => {
    try {
      const jsonData = canvasRef.current?.exportToJSON()
      if (jsonData) {
        const dataBlob = new Blob([jsonData], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `scriblio-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const jsonData = e.target?.result as string
            const data = JSON.parse(jsonData)
            clearCanvas()
            canvasRef.current?.clearCanvas()
            if (data.elements && Array.isArray(data.elements)) {
              data.elements.forEach((element: any) => addElement(element))
            }
            if (data.appState) {
              updateAppState(data.appState)
            }
            console.log('Import successful!')
          } catch (error) {
            console.error('Failed to import:', error)
            alert('Failed to import file. Please check the file format.')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const selectedElements = elements.filter(el =>
    appState.selectedElementIds.includes(el.id)
  )

  return (
    <div className="app-shell">
  <div className="topbar">
    {/* Left: tools */}
    <div className="topbar-left">
      <Toolbar
        appState={appState}
        activeTool={appState.activeTool}
        isToolLocked={appState.isToolLocked}
        onToolChange={handleToolChange}
        onToggleToolLock={handleToggleToolLock}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </div>

    {/* Center: Scriblio title */}
    <div className="topbar-title" aria-hidden="true">
      {['S','c','r','i','b','l','i','o'].map((char, i) => (
        <span
          key={i}
          style={{
            color: ['#ff5252','#ffca28','#4caf50','#29b6f6','#ab47bc','#ff9800','#ec407a','#66bb6a'][i % 8],
            textShadow: `
              -3px -3px 0 #000,
               3px -3px 0 #000,
              -3px  3px 0 #000,
               3px  3px 0 #000
            `,
            filter: 'drop-shadow(0 3px 2px rgba(0,0,0,0.5))'
          }}
        >
          {char}
        </span>
      ))}
    </div>

    {/* Right: lock + connection + menu */}
    <div className="topbar-right">
      <button
        className={`tool-btn lock-btn ${appState.isToolLocked ? 'active' : ''}`}
        onClick={handleToggleToolLock}
        title="Lock tool"
        aria-label="Lock tool"
      >
        🔒
      </button>

      <ConnectionStatus />

      <div className="hamburger-container">
        <button
          className={`hamburger-btn ${isPanelOpen ? 'active' : ''}`}
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          aria-label="Toggle properties panel"
        >
          <span className="hamburger-icon">☰</span>
          Menu
        </button>
      </div>
    </div>
  </div>
  
      {/* Main Content Area */}
      <div className="content">
        <div className="canvas-wrap">
          <ExcalidrawCanvas
            ref={canvasRef}
            elements={elements}
            appState={appState}
            onElementsChange={setElementsFromCanvas}
            onAppStateChange={updateAppState}
            onCanvasAppReady={(canvasApp) => {
              console.log('🎯 Canvas app ready callback fired')
              setCanvasAppRef(canvasApp)
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <Footer
        viewTransform={appState.viewTransform}
        selectedCount={appState.selectedElementIds.length}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Slide-out Properties Panel */}
      <PropertiesPanel
        selectedElements={selectedElements}
        appState={appState}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onClear={handleClear}
        onExport={handleExport}
        onImport={handleImport}
        onDeleteElements={deleteElements}
        onUpdateElement={updateElement}
        onPropertyChange={(updates: Partial<AppState>) => updateAppState(updates)}
      />

      {/* Panel Overlay */}
      {isPanelOpen && (
        <div
          className="panel-overlay"
          onClick={() => setIsPanelOpen(false)}
        />
      )}
    </div>
  )
}

export default function App() {
  const collaborationConfig = {
    roomId: 'scriblio-room-123',
    userId,
    userName,
    redisWsUrl: import.meta.env.VITE_REDIS_WS_URL,
    websocketUrl: import.meta.env.VITE_WEBSOCKET_URL,
    signaling: import.meta.env.VITE_SIGNALING_URLS?.split(','),
  }

  return (
    <CollaborationProvider config={collaborationConfig}>
      <PresenceProvider userId={userId} userName={userName} userColor={userColor}>
        <AppContent />
      </PresenceProvider>
    </CollaborationProvider>
  )
}