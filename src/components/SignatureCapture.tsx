import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Undo, Trash2 } from 'lucide-react';
export interface SignatureCaptureHandle {
  toDataURL: () => string;
  clear: () => void;
  isEmpty: () => boolean;
}
const SignatureCapture = forwardRef<SignatureCaptureHandle>((props, ref) => {
  // ----- Native canvas refs -----
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Store drawn paths for undo/clear functionality
  const pathsRef = useRef<Array<Array<{ x: number; y: number }>>>([]);
  const currentPathRef = useRef<Array<{ x: number; y: number }>>([]);
  const drawingRef = useRef(false);
    // ----- Expose the required imperative API -----
    useImperativeHandle(ref, () => ({
      /** Returns a PNG data‑URL of the current canvas content */
      toDataURL: () => {
        if (canvasRef.current) {
          return canvasRef.current.toDataURL('image/png');
        }
        return '';
      },
      /** Clears the canvas and resets internal path storage */
      clear: () => {
        if (ctxRef.current && canvasRef.current) {
          ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          pathsRef.current = [];
          currentPathRef.current = [];
        }
      },
      /** Returns true when no strokes have been drawn */
      isEmpty: () => pathsRef.current.length === 0,
    }));
  // ----- Canvas event handling (pointer events) -----
  const startDrawing = (e: PointerEvent) => {
    if (!ctxRef.current) return;
    drawingRef.current = true;
    const rect = canvasRef.current!.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    currentPathRef.current = [point];
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(point.x, point.y);
  };

  const draw = (e: PointerEvent) => {
    if (!drawingRef.current || !ctxRef.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    currentPathRef.current.push(point);
    ctxRef.current.lineTo(point.x, point.y);
    ctxRef.current.stroke();
  };

  const finishDrawing = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (currentPathRef.current.length) {
      pathsRef.current.push([...currentPathRef.current]);
      currentPathRef.current = [];
    }
  };

  const clearSignature = () => {
    if (ctxRef.current && canvasRef.current) {
      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      pathsRef.current = [];
    }
  };

  const undoSignature = () => {
    if (!pathsRef.current.length) {
      clearSignature();
      return;
    }
    // Remove the last stroke
    pathsRef.current.pop();

    // Redraw everything
    if (ctxRef.current && canvasRef.current) {
      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctxRef.current.beginPath();
      pathsRef.current.forEach((path) => {
        if (path.length === 0) return;
        ctxRef.current!.moveTo(path[0].x, path[0].y);
        path.forEach((pt) => ctxRef.current!.lineTo(pt.x, pt.y));
        ctxRef.current!.stroke();
      });
    }
  };

  // Initialise canvas context and attach pointer listeners once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#050505';
    ctxRef.current = ctx;

    // Ensure the canvas matches the displayed size (important for high‑DPI screens)
    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      // Redraw existing paths after a resize
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pathsRef.current.forEach((path) => {
        if (path.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        path.forEach((pt) => ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
      });
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Pointer event listeners
    canvas.addEventListener('pointerdown', startDrawing);
    canvas.addEventListener('pointermove', draw);
    canvas.addEventListener('pointerup', finishDrawing);
    canvas.addEventListener('pointerleave', finishDrawing);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('pointerdown', startDrawing);
      canvas.removeEventListener('pointermove', draw);
      canvas.removeEventListener('pointerup', finishDrawing);
      canvas.removeEventListener('pointerleave', finishDrawing);
    };
  }, []);
  return (
    <Card>
      <CardContent className="p-2">
        <div className="bg-white rounded-none border-2 border-border">
        {/* Native canvas for signature capture */}
        <canvas
          ref={canvasRef}
          className="w-full h-32 bg-white touch-none"
          style={{ touchAction: 'none' }}
        />
        </div>
      </CardContent>
      <CardFooter className="p-2 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={undoSignature}>
          <Undo className="w-4 h-4 mr-2" />
          Undo
        </Button>
        <Button variant="destructive" size="sm" onClick={clearSignature}>
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </CardFooter>
    </Card>
  );
});
SignatureCapture.displayName = 'SignatureCapture';
export { SignatureCapture };