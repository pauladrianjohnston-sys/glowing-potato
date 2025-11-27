'use client';

import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { HexColorPicker } from 'react-colorful';
import {
  Pencil,
  Square,
  Circle,
  Triangle,
  Type,
  Image as ImageIcon,
  MousePointer2,
  Eraser,
  Minus,
  Save,
  Upload,
  Trash2,
  Hand,
} from 'lucide-react';

type Tool =
  | 'select'
  | 'draw'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'line'
  | 'text'
  | 'image'
  | 'eraser'
  | 'pan';

export default function InfiniteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [showStrokeColorPicker, setShowStrokeColorPicker] = useState(false);
  const [showFillColorPicker, setShowFillColorPicker] = useState(false);
  const isDrawingRef = useRef(false);
  const currentShapeRef = useRef<fabric.Object | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric.js canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#ffffff',
      isDrawingMode: false,
    });

    fabricCanvasRef.current = canvas;

    // Load from localStorage
    const savedCanvas = localStorage.getItem('infiniteCanvas');
    if (savedCanvas) {
      canvas.loadFromJSON(savedCanvas, () => {
        canvas.renderAll();
      });
    }

    // Handle window resize
    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    // Setup mouse events for drawing shapes
    canvas.on('mouse:down', (options) => {
      if (!options.e) return;

      const pointer = canvas.getPointer(options.e);
      isDrawingRef.current = true;

      if (currentTool === 'draw') {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = strokeColor;
        canvas.freeDrawingBrush.width = strokeWidth;
      } else if (currentTool === 'rectangle') {
        const rect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: fillColor === '#transparent' ? 'transparent' : fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
        });
        canvas.add(rect);
        currentShapeRef.current = rect;
      } else if (currentTool === 'circle') {
        const circle = new fabric.Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 0,
          fill: fillColor === '#transparent' ? 'transparent' : fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
        });
        canvas.add(circle);
        currentShapeRef.current = circle;
      } else if (currentTool === 'triangle') {
        const triangle = new fabric.Triangle({
          left: pointer.x,
          top: pointer.y,
          width: 0,
          height: 0,
          fill: fillColor === '#transparent' ? 'transparent' : fillColor,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
        });
        canvas.add(triangle);
        currentShapeRef.current = triangle;
      } else if (currentTool === 'line') {
        const line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
          stroke: strokeColor,
          strokeWidth: strokeWidth,
        });
        canvas.add(line);
        currentShapeRef.current = line;
      } else if (currentTool === 'text') {
        const text = new fabric.IText('Type here...', {
          left: pointer.x,
          top: pointer.y,
          fill: strokeColor,
          fontSize: 20,
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        setCurrentTool('select');
      } else if (currentTool === 'eraser') {
        const target = canvas.findTarget(options.e, false);
        if (target) {
          canvas.remove(target);
        }
      }
    });

    canvas.on('mouse:move', (options) => {
      if (!isDrawingRef.current || !options.e) return;

      const pointer = canvas.getPointer(options.e);

      if (currentTool === 'rectangle' && currentShapeRef.current) {
        const rect = currentShapeRef.current as fabric.Rect;
        const startX = rect.left!;
        const startY = rect.top!;

        rect.set({
          width: Math.abs(pointer.x - startX),
          height: Math.abs(pointer.y - startY),
          left: Math.min(startX, pointer.x),
          top: Math.min(startY, pointer.y),
        });
        canvas.renderAll();
      } else if (currentTool === 'circle' && currentShapeRef.current) {
        const circle = currentShapeRef.current as fabric.Circle;
        const startX = circle.left!;
        const startY = circle.top!;
        const radius = Math.sqrt(
          Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)
        ) / 2;

        circle.set({ radius });
        canvas.renderAll();
      } else if (currentTool === 'triangle' && currentShapeRef.current) {
        const triangle = currentShapeRef.current as fabric.Triangle;
        const startX = triangle.left!;
        const startY = triangle.top!;

        triangle.set({
          width: Math.abs(pointer.x - startX),
          height: Math.abs(pointer.y - startY),
        });
        canvas.renderAll();
      } else if (currentTool === 'line' && currentShapeRef.current) {
        const line = currentShapeRef.current as fabric.Line;
        line.set({ x2: pointer.x, y2: pointer.y });
        canvas.renderAll();
      }
    });

    canvas.on('mouse:up', () => {
      isDrawingRef.current = false;
      currentShapeRef.current = null;

      if (currentTool === 'draw') {
        canvas.isDrawingMode = false;
      }
    });

    // Auto-save every 5 seconds
    const saveInterval = setInterval(() => {
      saveCanvas();
    }, 5000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(saveInterval);
      canvas.dispose();
    };
  }, [currentTool, strokeColor, fillColor, strokeWidth]);

  const saveCanvas = () => {
    if (fabricCanvasRef.current) {
      const json = JSON.stringify(fabricCanvasRef.current.toJSON());
      localStorage.setItem('infiniteCanvas', json);
    }
  };

  const clearCanvas = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.backgroundColor = '#ffffff';
      saveCanvas();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvasRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      fabric.Image.fromURL(imgUrl, (img) => {
        img.scaleToWidth(300);
        img.set({
          left: 100,
          top: 100,
        });
        fabricCanvasRef.current?.add(img);
      });
    };
    reader.readAsDataURL(file);
  };

  const tools = [
    { id: 'select' as Tool, icon: MousePointer2, label: 'Select' },
    { id: 'pan' as Tool, icon: Hand, label: 'Pan' },
    { id: 'draw' as Tool, icon: Pencil, label: 'Draw' },
    { id: 'rectangle' as Tool, icon: Square, label: 'Rectangle' },
    { id: 'circle' as Tool, icon: Circle, label: 'Circle' },
    { id: 'triangle' as Tool, icon: Triangle, label: 'Triangle' },
    { id: 'line' as Tool, icon: Minus, label: 'Line' },
    { id: 'text' as Tool, icon: Type, label: 'Text' },
    { id: 'eraser' as Tool, icon: Eraser, label: 'Eraser' },
  ];

  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    if (currentTool === 'select') {
      fabricCanvasRef.current.isDrawingMode = false;
      fabricCanvasRef.current.selection = true;
      fabricCanvasRef.current.forEachObject((obj) => {
        obj.selectable = true;
      });
    } else if (currentTool === 'pan') {
      fabricCanvasRef.current.isDrawingMode = false;
      fabricCanvasRef.current.selection = false;
      fabricCanvasRef.current.forEachObject((obj) => {
        obj.selectable = false;
      });
    } else {
      fabricCanvasRef.current.isDrawingMode = false;
      fabricCanvasRef.current.selection = false;
      fabricCanvasRef.current.discardActiveObject();
      fabricCanvasRef.current.renderAll();
    }
  }, [currentTool]);

  return (
    <div className="relative w-full h-full">
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-lg shadow-lg p-4 flex items-center gap-4">
        {/* Tools */}
        <div className="flex gap-2 border-r pr-4">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setCurrentTool(tool.id)}
              className={`p-2 rounded hover:bg-gray-100 ${
                currentTool === tool.id ? 'bg-blue-100 text-blue-600' : ''
              }`}
              title={tool.label}
            >
              <tool.icon size={20} />
            </button>
          ))}
        </div>

        {/* Color Pickers */}
        <div className="flex gap-2 border-r pr-4">
          <div className="relative">
            <button
              onClick={() => {
                setShowStrokeColorPicker(!showStrokeColorPicker);
                setShowFillColorPicker(false);
              }}
              className="w-8 h-8 rounded border-2 border-gray-300"
              style={{ backgroundColor: strokeColor }}
              title="Stroke Color"
            />
            {showStrokeColorPicker && (
              <div className="absolute top-12 left-0 z-20 bg-white p-2 rounded shadow-lg">
                <HexColorPicker color={strokeColor} onChange={setStrokeColor} />
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => {
                setShowFillColorPicker(!showFillColorPicker);
                setShowStrokeColorPicker(false);
              }}
              className="w-8 h-8 rounded border-2 border-gray-300"
              style={{
                backgroundColor:
                  fillColor === '#transparent' ? '#ffffff' : fillColor,
                backgroundImage:
                  fillColor === '#transparent'
                    ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)'
                    : 'none',
                backgroundSize: '10px 10px',
                backgroundPosition: '0 0, 5px 5px',
              }}
              title="Fill Color"
            />
            {showFillColorPicker && (
              <div className="absolute top-12 left-0 z-20 bg-white p-2 rounded shadow-lg">
                <HexColorPicker color={fillColor} onChange={setFillColor} />
                <button
                  onClick={() => setFillColor('#transparent')}
                  className="mt-2 w-full px-2 py-1 bg-gray-200 rounded text-sm"
                >
                  Transparent
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-2 border-r pr-4">
          <label className="text-sm">Width:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-24"
          />
          <span className="text-sm w-6">{strokeWidth}</span>
        </div>

        {/* Image Upload */}
        <div className="border-r pr-4">
          <label className="p-2 rounded hover:bg-gray-100 cursor-pointer inline-block">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <ImageIcon size={20} />
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={saveCanvas}
            className="p-2 rounded hover:bg-gray-100"
            title="Save"
          >
            <Save size={20} />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 rounded hover:bg-red-100 text-red-600"
            title="Clear Canvas"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} />
    </div>
  );
}
