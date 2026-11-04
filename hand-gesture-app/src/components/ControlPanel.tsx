
import { memo } from 'react';
import type { ChangeEvent, Dispatch, ReactElement, SetStateAction } from 'react';
import '../styles/ControlPanel.css';

type ActiveTool = 'freehand' | 'shape';
type ViewMode = '2d' | '3d';

interface ControlPanelProps {
    activeTool: ActiveTool;
    setActiveTool: Dispatch<SetStateAction<ActiveTool>>;
    brushColor: string;
    setBrushColor: Dispatch<SetStateAction<string>>;
    brushSize: number;
    setBrushSize: Dispatch<SetStateAction<number>>;
    isDynamicSize: boolean;
    setIsDynamicSize: Dispatch<SetStateAction<boolean>>;
    showSkeleton: boolean;
    setShowSkeleton: Dispatch<SetStateAction<boolean>>;
    clearCanvas: () => void;
    undo: () => void;
    saveImage: () => void;
    viewMode: ViewMode;
    setViewMode: Dispatch<SetStateAction<ViewMode>>;
    isNeon: boolean;
    setIsNeon: Dispatch<SetStateAction<boolean>>;
    showGrid: boolean;
    setShowGrid: Dispatch<SetStateAction<boolean>>;
    autoRotate: boolean;
    setAutoRotate: Dispatch<SetStateAction<boolean>>;
    export3D: () => void;
}

const ControlPanel = ({
    activeTool,
    setActiveTool,
    brushColor,
    setBrushColor,
    brushSize,
    setBrushSize,
    isDynamicSize,
    setIsDynamicSize,
    showSkeleton,
    setShowSkeleton,
    clearCanvas,
    undo,
    saveImage,
    viewMode,
    setViewMode,
    isNeon,
    setIsNeon,
    showGrid,
    setShowGrid,
    autoRotate,
    setAutoRotate,
    export3D
}: ControlPanelProps): ReactElement => {

    return (
        <div className="control-panel glassmorphism">
            <div className="panel-header">
                <h2>Air Draw <span>Pro</span></h2>
            </div>

            <div className="control-group">
                <h3>View Mode</h3>
                <div className="toggle-buttons">
                    <button
                        className={viewMode === '2d' ? 'active' : ''}
                        onClick={(): void => setViewMode('2d')}
                    >
                        2D View
                    </button>
                    <button
                        className={viewMode === '3d' ? 'active' : ''}
                        onClick={(): void => setViewMode('3d')}
                    >
                        3D View
                    </button>
                </div>
            </div>

            <div className="control-group">
                <h3>Tool</h3>
                <div className="tool-buttons">
                    <button
                        className={activeTool === 'freehand' ? 'active' : ''}
                        onClick={(): void => setActiveTool('freehand')}
                    >
                        Freehand
                    </button>
                    <button
                        className={activeTool === 'shape' ? 'active' : ''}
                        onClick={(): void => setActiveTool('shape')}
                        disabled={viewMode === '3d'}
                    >
                        Shape
                    </button>
                </div>
            </div>

            <div className="control-group">
                <h3>Color Palette</h3>
                <div className="color-picker">
                    {['#00FF00', '#FF007F', '#00D4FF', '#FFEA00', '#FFFFFF', '#121212'].map((color: string): ReactElement => (
                        <div
                            key={color}
                            className={`color-swatch ${brushColor === color ? 'active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={(): void => setBrushColor(color)}
                        />
                    ))}
                </div>
            </div>

            <div className="control-group">
                <h3>Brush Size</h3>
                <div className="size-control">
                    <input
                        type="range"
                        min="1"
                        max="30"
                        value={brushSize}
                        onChange={(e: ChangeEvent<HTMLInputElement>): void => setBrushSize(parseInt(e.target.value))}
                        disabled={isDynamicSize}
                    />
                    <span className="size-value">{brushSize}px</span>
                </div>
                <label className="checkbox-container">
                    <input
                        type="checkbox"
                        checked={isDynamicSize}
                        onChange={(e: ChangeEvent<HTMLInputElement>): void => setIsDynamicSize(e.target.checked)}
                    />
                    <span>Dynamic Depth Size</span>
                </label>
            </div>

            <div className="control-group">
                <h3>Visualization</h3>
                <label className="checkbox-container">
                    <input
                        type="checkbox"
                        checked={showSkeleton}
                        onChange={(e: ChangeEvent<HTMLInputElement>): void => setShowSkeleton(e.target.checked)}
                    />
                    <span>Show Hand Skeleton</span>
                </label>
                {viewMode === '3d' && (
                    <>
                        <label className="checkbox-container">
                            <input
                                type="checkbox"
                                checked={isNeon}
                                onChange={(e: ChangeEvent<HTMLInputElement>): void => setIsNeon(e.target.checked)}
                            />
                            <span>Neon Glow</span>
                        </label>
                        <label className="checkbox-container">
                            <input
                                type="checkbox"
                                checked={showGrid}
                                onChange={(e: ChangeEvent<HTMLInputElement>): void => setShowGrid(e.target.checked)}
                            />
                            <span>Show Grid</span>
                        </label>
                        <label className="checkbox-container">
                            <input
                                type="checkbox"
                                checked={autoRotate}
                                onChange={(e: ChangeEvent<HTMLInputElement>): void => setAutoRotate(e.target.checked)}
                            />
                            <span>Auto-Rotate Scene</span>
                        </label>
                    </>
                )}
            </div>

            <div className="action-buttons">
                <button onClick={undo} className="btn-secondary">Undo</button>
                <button onClick={clearCanvas} className="btn-danger">Clear</button>
                <button onClick={saveImage} className="btn-primary">Save Image</button>
                {viewMode === '3d' && (
                    <button onClick={export3D} className="btn-success">Export 3D (.glb)</button>
                )}
            </div>
        </div>
    );
};

export default memo(ControlPanel);
