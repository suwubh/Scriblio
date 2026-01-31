import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { CanvasApp } from './Canvas'
import { ExcalidrawElement, AppState } from '../types/excalidraw'
import { usePresence } from '../collaboration'

interface ExcalidrawCanvasProps {
  elements: ExcalidrawElement[]
  appState: AppState
  onElementsChange: (elements: ExcalidrawElement[]) => void
  onAppStateChange: (appState: Partial<AppState>) => void
  onCanvasAppReady?: (canvasApp: CanvasApp) => void
}

export interface ExcalidrawCanvasRef {
  clearCanvas: () => void
  exportToJSON: () => string
  importFromJSON: (json: string) => void
}

export const ExcalidrawCanvas = forwardRef<ExcalidrawCanvasRef, ExcalidrawCanvasProps>(
  ({ appState, onAppStateChange, elements, onElementsChange, onCanvasAppReady }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const appRef = useRef<CanvasApp | null>(null)
    const isInitializing = useRef(false)
    const hasInitialized = useRef(false) 

    const { users, updateCursor } = usePresence()

    useImperativeHandle(ref, () => ({
      clearCanvas: () => {
        if (appRef.current) appRef.current.clear()
      },
      exportToJSON: () => appRef.current?.exportToJSON() || '{}',
      importFromJSON: (json: string) => {
        if (appRef.current) appRef.current.importFromJSON(json)
      },
    }))

    useEffect(() => {
      // Prevent multiple initializations
      if (!canvasRef.current || hasInitialized.current || isInitializing.current) {
        return
      }

      isInitializing.current = true
      console.log('🎨 Initializing CanvasApp...')
      
      try {
        const canvasApp = new CanvasApp(canvasRef.current, appState)
        appRef.current = canvasApp

        canvasApp.setOnElementsMutated((els) => onElementsChange(els))
        canvasApp.setOnAppStateMutated((st) => onAppStateChange(st))

        // Notify parent that canvas app is ready
        if (onCanvasAppReady) {
          onCanvasAppReady(canvasApp)
        }

        hasInitialized.current = true
        console.log('✅ CanvasApp initialized successfully')

        // Setup resize handler
        const handleResize = () => {
          if (appRef.current) {
            appRef.current.resize()
          }
        }
      
        handleResize()
        window.addEventListener('resize', handleResize)

        return () => {
          console.log('🧹 Cleaning up CanvasApp...')
          window.removeEventListener('resize', handleResize)
          
          if (appRef.current) {
            appRef.current.destroy()
            appRef.current = null
          }
          
          hasInitialized.current = false
          isInitializing.current = false
        }
      } catch (error) {
        console.error('❌ Failed to initialize CanvasApp:', error)
        isInitializing.current = false
        return undefined
      }
    }, []) 

    useEffect(() => {
      if (hasInitialized.current && 
          appRef.current && 
          typeof appRef.current.updateAppState === 'function') {
        appRef.current.updateAppState(appState as AppState)
      }
    }, [appState])

    useEffect(() => {
      if (hasInitialized.current && 
          elements !== undefined && 
          appRef.current && 
          typeof appRef.current.setElements === 'function') {
        appRef.current.setElements(elements)
      }
    }, [elements])

    useEffect(() => {
      if (!canvasRef.current) return

      if (appState.activeTool === 'eraser') {
        canvasRef.current.classList.add('cursor-eraser')
      } else {
        canvasRef.current.classList.remove('cursor-eraser')
      }
    }, [appState.activeTool])

    // Mouse tracking for collaboration
    const handleMouseMove = (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        updateCursor(x, y)
      }
    }

    // Render remote cursors
    const renderRemoteCursors = () => {
      return users.map(user => {
        if (!user.cursor) return null

        return (
          <div
            key={user.userId}
            style={{
              position: 'absolute',
              left: user.cursor.x - 8,
              top: user.cursor.y - 8,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: user.color,
              pointerEvents: 'none',
              zIndex: 1000,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{
              position: 'absolute',
              left: '20px',
              top: '-8px',
              backgroundColor: user.color,
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              whiteSpace: 'nowrap'
            }}>
              {user.name}
            </div>
          </div>
        )
      })
    }

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            touchAction: 'none'
          }}
          onMouseMove={handleMouseMove}
        />
        {renderRemoteCursors()}
      </div>
    )
  }
)

ExcalidrawCanvas.displayName = 'ExcalidrawCanvas'