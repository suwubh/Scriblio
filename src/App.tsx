// src/App.tsx
import { useRef, useState } from 'react'
import { ExcalidrawCanvas, ExcalidrawCanvasRef } from './components/ExcalidrawCanvas'
import { Toolbar } from './components/Toolbar'
import { PropertiesPanel } from './components/PropertiesPanel'
import { Footer } from './components/Footer'
import { useExcalidrawState } from './hooks/useExcalidrawState'
import { CollaborationProvider, PresenceProvider } from './collaboration'
import { generateUserId, generateUserColor } from './collaboration'
import { ConnectionStatus } from './components/ConnectionStatus' // We'll create this
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
    <div className="excalidraw-app">
      {/* Connection Status Indicator */}
      <ConnectionStatus />
      
      {/* Hamburger Menu Button */}
      <button 
        className="hamburger-menu"
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        aria-label="Toggle properties panel"
      >
        ☰
      </button>

      {/* Main Canvas Area */}
      <ExcalidrawCanvas
        ref={(ref) => {
          canvasRef.current = ref;
          if (ref) setCanvasAppRef(ref);
        }}
        elements={elements}
        appState={appState}
        onAppStateChange={updateAppState}
        onElementsChange={setElementsFromCanvas}
      />

      <Toolbar
        appState={appState}
        onToolChange={handleToolChange}
        onToggleToolLock={handleToggleToolLock}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo} activeTool={''} isToolLocked={false}      />

      {/* Slide-out Properties Panel */}
      <PropertiesPanel
        isOpen={isPanelOpen}
        selectedElements={selectedElements}
        appState={appState}
        onUpdateElement={updateElement}
        onDeleteElements={deleteElements}
        onClose={() => setIsPanelOpen(false)}
        onClear={handleClear}
        onExport={handleExport}
        onImport={handleImport} onPropertyChange={(updates: Partial<AppState>) => updateAppState(updates)} />

      {/* Overlay when panel is open */}
      {isPanelOpen && (
        <div 
          className="panel-overlay"
          onClick={() => setIsPanelOpen(false)}
        />
      )}

      <Footer viewTransform={{
        x: 0,
        y: 0,
        zoom: 0
      }} selectedCount={0} onUndo={function (): void {
        throw new Error('Function not implemented.')
      } } onRedo={function (): void {
        throw new Error('Function not implemented.')
      } } canUndo={false} canRedo={false} />
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
    signaling: import.meta.env.VITE_SIGNALING_URLS?.split(','), // ✅ Now using your server
  }

  return (
    <CollaborationProvider config={collaborationConfig}>
      <PresenceProvider userId={userId} userName={userName} userColor={userColor}>
        <AppContent />
      </PresenceProvider>
    </CollaborationProvider>
  )
}
