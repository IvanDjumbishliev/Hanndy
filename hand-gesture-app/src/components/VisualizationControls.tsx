import type { ChangeEvent, Dispatch, ReactElement, SetStateAction } from 'react';
import type { DrawingViewMode } from '../hooks/useAirDrawing';

interface VisualizationControlsProps {
  showSkeleton: boolean;
  setShowSkeleton: Dispatch<SetStateAction<boolean>>;
  viewMode: DrawingViewMode;
  isNeon: boolean;
  setIsNeon: Dispatch<SetStateAction<boolean>>;
  showGrid: boolean;
  setShowGrid: Dispatch<SetStateAction<boolean>>;
  autoRotate: boolean;
  setAutoRotate: Dispatch<SetStateAction<boolean>>;
  undo: () => void;
  clearCanvas: () => void;
  saveImage: () => void;
  export3D: () => void;
}

const VisualizationControls = ({
  showSkeleton, setShowSkeleton, viewMode, isNeon, setIsNeon, showGrid,
  setShowGrid, autoRotate, setAutoRotate, undo, clearCanvas, saveImage, export3D,
}: VisualizationControlsProps): ReactElement => (
  <>
    <div className="control-group">
      <h3>Visualization</h3>
      <Toggle label="Show Hand Skeleton" checked={showSkeleton} onChange={setShowSkeleton} />
      {viewMode === '3d' && (
        <>
          <Toggle label="Neon Glow" checked={isNeon} onChange={setIsNeon} />
          <Toggle label="Show Grid" checked={showGrid} onChange={setShowGrid} />
          <Toggle label="Auto-Rotate Scene" checked={autoRotate} onChange={setAutoRotate} />
        </>
      )}
    </div>
    <div className="action-buttons">
      <button onClick={undo} className="btn-secondary">Undo</button>
      <button onClick={clearCanvas} className="btn-danger">Clear</button>
      <button onClick={saveImage} className="btn-primary">Save Image</button>
      {viewMode === '3d' && <button onClick={export3D} className="btn-success">Export 3D (.glb)</button>}
    </div>
  </>
);

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: Dispatch<SetStateAction<boolean>>;
}

const Toggle = ({ label, checked, onChange }: ToggleProps): ReactElement => (
  <label className="checkbox-container">
    <input type="checkbox" checked={checked}
      onChange={(event: ChangeEvent<HTMLInputElement>): void => onChange(event.target.checked)} />
    <span>{label}</span>
  </label>
);

export default VisualizationControls;
