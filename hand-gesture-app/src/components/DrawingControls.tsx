import type { ChangeEvent, Dispatch, ReactElement, SetStateAction } from 'react';
import type { DrawingTool, DrawingViewMode } from '../hooks/useAirDrawing';

export interface DrawingControlsProps {
  activeTool: DrawingTool;
  setActiveTool: Dispatch<SetStateAction<DrawingTool>>;
  brushColor: string;
  setBrushColor: Dispatch<SetStateAction<string>>;
  brushSize: number;
  setBrushSize: Dispatch<SetStateAction<number>>;
  isDynamicSize: boolean;
  setIsDynamicSize: Dispatch<SetStateAction<boolean>>;
  viewMode: DrawingViewMode;
  setViewMode: Dispatch<SetStateAction<DrawingViewMode>>;
}

const DrawingControls = ({
  activeTool, setActiveTool, brushColor, setBrushColor, brushSize, setBrushSize,
  isDynamicSize, setIsDynamicSize, viewMode, setViewMode,
}: DrawingControlsProps): ReactElement => (
  <>
    <div className="control-group">
      <h3>View Mode</h3>
      <div className="toggle-buttons">
        <button className={viewMode === '2d' ? 'active' : ''} onClick={(): void => setViewMode('2d')}>2D View</button>
        <button className={viewMode === '3d' ? 'active' : ''} onClick={(): void => setViewMode('3d')}>3D View</button>
      </div>
    </div>
    <div className="control-group">
      <h3>Tool</h3>
      <div className="tool-buttons">
        <button className={activeTool === 'freehand' ? 'active' : ''} onClick={(): void => setActiveTool('freehand')}>Freehand</button>
        <button className={activeTool === 'shape' ? 'active' : ''} disabled={viewMode === '3d'} onClick={(): void => setActiveTool('shape')}>Shape</button>
      </div>
    </div>
    <div className="control-group">
      <h3>Color Palette</h3>
      <div className="color-picker">
        {['#00FF00', '#FF007F', '#00D4FF', '#FFEA00', '#FFFFFF', '#121212'].map((color: string): ReactElement => (
          <button
            type="button"
            key={color}
            aria-label={`Set brush color ${color}`}
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
        <input type="range" min="1" max="30" value={brushSize} disabled={isDynamicSize}
          onChange={(event: ChangeEvent<HTMLInputElement>): void => setBrushSize(parseInt(event.target.value))} />
        <span className="size-value">{brushSize}px</span>
      </div>
      <label className="checkbox-container">
        <input type="checkbox" checked={isDynamicSize}
          onChange={(event: ChangeEvent<HTMLInputElement>): void => setIsDynamicSize(event.target.checked)} />
        <span>Dynamic Depth Size</span>
      </label>
    </div>
  </>
);

export default DrawingControls;
