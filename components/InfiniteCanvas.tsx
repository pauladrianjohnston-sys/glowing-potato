'use client';

import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, RegularPolygon, Text, Image as KonvaImage } from 'react-konva';
import { HexColorPicker } from 'react-colorful';
import {
  Pencil,
  Square,
  Circle as CircleIcon,
  Triangle,
  Type,
  Image as ImageIcon,
  MousePointer2,
  Eraser,
  Minus,
  Save,
  Trash2,
  Hand,
} from 'lucide-react';
import Konva from 'konva';

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

interface Shape {
  id: string;
  type: 'line' | 'rect' | 'circle' | 'triangle' | 'text' | 'image';
  x: number;
  y: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  points?: number[];
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  image?: HTMLImageElement;
}

export default function InfiniteCanvas() {
  const [tool, setTool] = useState<Tool>('select');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [showStrokeColorPicker, setShowStrokeColorPicker] = useState(false);
  const [showFillColorPicker, setShowFillColorPicker] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const isDrawing = useRef(false);
  const currentShape = useRef<Shape | null>(null);
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    // Set dimensions on mount
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Load from localStorage
    const saved = localStorage.getItem('infiniteCanvas');
    if (saved) {
      try {
        setShapes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load canvas:', e);
      }
    }

    // Handle resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    // Auto-save
    const interval = setInterval(() => {
      if (shapes.length > 0) {
        localStorage.setItem('infiniteCanvas', JSON.stringify(shapes));
      }
    }, 5000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
    };
  }, [shapes]);

  const handleMouseDown = (e: any) => {
    if (tool === 'select' || tool === 'pan') return;

    const pos = e.target.getStage().getPointerPosition();
    isDrawing.current = true;

    if (tool === 'draw') {
      currentShape.current = {
        id: Date.now().toString(),
        type: 'line',
        points: [pos.x, pos.y],
        stroke: strokeColor,
        strokeWidth,
        x: 0,
        y: 0,
      };
    } else if (tool === 'rectangle') {
      currentShape.current = {
        id: Date.now().toString(),
        type: 'rect',
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        stroke: strokeColor,
        strokeWidth,
        fill: fillColor === 'transparent' ? undefined : fillColor,
      };
    } else if (tool === 'circle') {
      currentShape.current = {
        id: Date.now().toString(),
        type: 'circle',
        x: pos.x,
        y: pos.y,
        radius: 0,
        stroke: strokeColor,
        strokeWidth,
        fill: fillColor === 'transparent' ? undefined : fillColor,
      };
    } else if (tool === 'triangle') {
      currentShape.current = {
        id: Date.now().toString(),
        type: 'triangle',
        x: pos.x,
        y: pos.y,
        radius: 0,
        stroke: strokeColor,
        strokeWidth,
        fill: fillColor === 'transparent' ? undefined : fillColor,
      };
    } else if (tool === 'line') {
      currentShape.current = {
        id: Date.now().toString(),
        type: 'line',
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: strokeColor,
        strokeWidth,
        x: 0,
        y: 0,
      };
    } else if (tool === 'text') {
      const newText: Shape = {
        id: Date.now().toString(),
        type: 'text',
        x: pos.x,
        y: pos.y,
        text: 'Double-click to edit',
        fontSize: 20,
        fill: strokeColor,
      };
      setShapes([...shapes, newText]);
      setTool('select');
      return;
    }

    if (currentShape.current) {
      setShapes([...shapes, currentShape.current]);
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current || !currentShape.current) return;

    const pos = e.target.getStage().getPointerPosition();

    setShapes((prevShapes) => {
      const newShapes = [...prevShapes];
      const index = newShapes.findIndex((s) => s.id === currentShape.current?.id);

      if (index === -1) return prevShapes;

      if (tool === 'draw' && currentShape.current.points) {
        newShapes[index] = {
          ...currentShape.current,
          points: [...currentShape.current.points, pos.x, pos.y],
        };
        currentShape.current = newShapes[index];
      } else if (tool === 'rectangle') {
        const startX = currentShape.current.x;
        const startY = currentShape.current.y;
        newShapes[index] = {
          ...currentShape.current,
          width: pos.x - startX,
          height: pos.y - startY,
        };
      } else if (tool === 'circle' || tool === 'triangle') {
        const startX = currentShape.current.x;
        const startY = currentShape.current.y;
        const radius = Math.sqrt(
          Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2)
        );
        newShapes[index] = {
          ...currentShape.current,
          radius,
        };
      } else if (tool === 'line') {
        const points = currentShape.current.points || [];
        newShapes[index] = {
          ...currentShape.current,
          points: [points[0], points[1], pos.x, pos.y],
        };
      }

      return newShapes;
    });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    currentShape.current = null;
  };

  const handleClick = (e: any) => {
    if (tool !== 'eraser') return;

    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) return;

    const id = e.target.id();
    setShapes(shapes.filter((s) => s.id !== id));
  };

  const saveCanvas = () => {
    localStorage.setItem('infiniteCanvas', JSON.stringify(shapes));
    alert('Canvas saved!');
  };

  const clearCanvas = () => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      setShapes([]);
      localStorage.removeItem('infiniteCanvas');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const newImage: Shape = {
          id: Date.now().toString(),
          type: 'image',
          x: 100,
          y: 100,
          width: img.width > 400 ? 400 : img.width,
          height: img.width > 400 ? (400 / img.width) * img.height : img.height,
          image: img,
        };
        setShapes([...shapes, newImage]);
      };
    };
    reader.readAsDataURL(file);
  };

  const tools = [
    { id: 'select' as Tool, icon: MousePointer2, label: 'Select' },
    { id: 'pan' as Tool, icon: Hand, label: 'Pan' },
    { id: 'draw' as Tool, icon: Pencil, label: 'Draw' },
    { id: 'rectangle' as Tool, icon: Square, label: 'Rectangle' },
    { id: 'circle' as Tool, icon: CircleIcon, label: 'Circle' },
    { id: 'triangle' as Tool, icon: Triangle, label: 'Triangle' },
    { id: 'line' as Tool, icon: Minus, label: 'Line' },
    { id: 'text' as Tool, icon: Type, label: 'Text' },
    { id: 'eraser' as Tool, icon: Eraser, label: 'Eraser' },
  ];

  return (
    <div className="relative w-full h-full bg-gray-50">
      {/* Toolbar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-lg shadow-lg p-4 flex items-center gap-4 flex-wrap max-w-[95vw]">
        {/* Tools */}
        <div className="flex gap-2 border-r pr-4">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                tool === t.id ? 'bg-blue-100 text-blue-600' : ''
              }`}
              title={t.label}
            >
              <t.icon size={20} />
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
              className="w-8 h-8 rounded border-2 border-gray-300 shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: strokeColor }}
              title="Stroke Color"
            />
            {showStrokeColorPicker && (
              <div className="absolute top-12 left-0 z-20 bg-white p-2 rounded shadow-lg">
                <HexColorPicker color={strokeColor} onChange={setStrokeColor} />
                <button
                  onClick={() => setShowStrokeColorPicker(false)}
                  className="mt-2 w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                >
                  Close
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => {
                setShowFillColorPicker(!showFillColorPicker);
                setShowStrokeColorPicker(false);
              }}
              className="w-8 h-8 rounded border-2 border-gray-300 shadow-sm hover:shadow-md transition-shadow"
              style={{
                backgroundColor: fillColor === 'transparent' ? '#ffffff' : fillColor,
                backgroundImage:
                  fillColor === 'transparent'
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
                  onClick={() => setFillColor('transparent')}
                  className="mt-2 w-full px-2 py-1 bg-gray-200 rounded text-sm"
                >
                  Transparent
                </button>
                <button
                  onClick={() => setShowFillColorPicker(false)}
                  className="mt-2 w-full px-2 py-1 bg-gray-800 text-white rounded text-sm"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-2 border-r pr-4">
          <label className="text-sm font-medium">Width:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-24"
          />
          <span className="text-sm font-mono w-8 text-center">{strokeWidth}</span>
        </div>

        {/* Image Upload */}
        <div className="border-r pr-4">
          <label className="p-2 rounded hover:bg-gray-100 cursor-pointer inline-block transition-colors" title="Upload Image">
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
            className="p-2 rounded hover:bg-green-100 hover:text-green-600 transition-colors"
            title="Save"
          >
            <Save size={20} />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 rounded hover:bg-red-100 text-red-600 transition-colors"
            title="Clear Canvas"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onClick={handleClick}
        draggable={tool === 'pan'}
      >
        <Layer>
          {shapes.map((shape) => {
            const commonProps = {
              key: shape.id,
              id: shape.id,
              draggable: tool === 'select',
            };

            if (shape.type === 'line') {
              return (
                <Line
                  {...commonProps}
                  points={shape.points}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              );
            }

            if (shape.type === 'rect') {
              return (
                <Rect
                  {...commonProps}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  fill={shape.fill}
                />
              );
            }

            if (shape.type === 'circle') {
              return (
                <Circle
                  {...commonProps}
                  x={shape.x}
                  y={shape.y}
                  radius={shape.radius}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  fill={shape.fill}
                />
              );
            }

            if (shape.type === 'triangle') {
              return (
                <RegularPolygon
                  {...commonProps}
                  x={shape.x}
                  y={shape.y}
                  sides={3}
                  radius={shape.radius}
                  stroke={shape.stroke}
                  strokeWidth={shape.strokeWidth}
                  fill={shape.fill}
                />
              );
            }

            if (shape.type === 'text') {
              return (
                <Text
                  {...commonProps}
                  x={shape.x}
                  y={shape.y}
                  text={shape.text}
                  fontSize={shape.fontSize}
                  fill={shape.fill}
                />
              );
            }

            if (shape.type === 'image' && shape.image) {
              return (
                <KonvaImage
                  {...commonProps}
                  x={shape.x}
                  y={shape.y}
                  image={shape.image}
                  width={shape.width}
                  height={shape.height}
                />
              );
            }

            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
}
