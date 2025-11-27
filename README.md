# Infinite Canvas App

An infinite creative canvas built with Next.js and Fabric.js where you can draw, add shapes, text, and images.

## Features

- **Drawing Tools**: Freehand drawing with customizable stroke width
- **Shapes**: Rectangle, Circle, Triangle, and Line tools
- **Text**: Add and edit text directly on the canvas
- **Images**: Upload and place images on your canvas
- **Color Picker**: Customize stroke and fill colors
- **Selection Tool**: Select, move, resize, and rotate objects
- **Pan Tool**: Navigate around your infinite canvas
- **Eraser**: Remove individual objects
- **Auto-save**: Your work is automatically saved to browser local storage every 5 seconds
- **Manual Save**: Click the save button to save immediately
- **Clear Canvas**: Start fresh with the clear button

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Fabric.js** - HTML5 canvas library
- **Tailwind CSS** - Styling
- **react-colorful** - Color picker component
- **lucide-react** - Icon library
- **Local Storage** - Canvas persistence

## Getting Started

### Prerequisites

- Node.js 18+ installed on your machine
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

### Tools

- **Select (Arrow)**: Click to select and manipulate objects on the canvas
- **Pan (Hand)**: Click and drag to navigate around the canvas
- **Draw (Pencil)**: Freehand drawing tool
- **Rectangle**: Click and drag to create rectangles
- **Circle**: Click and drag to create circles
- **Triangle**: Click and drag to create triangles
- **Line**: Click and drag to create straight lines
- **Text**: Click anywhere to add editable text
- **Eraser**: Click on objects to remove them

### Controls

- **Stroke Color**: Click the first color button to change the outline color
- **Fill Color**: Click the second color button to change the fill color (supports transparent)
- **Stroke Width**: Use the slider to adjust line thickness (1-20px)
- **Image Upload**: Click the image icon to upload and add images to your canvas
- **Save**: Click the save icon to manually save your work
- **Clear**: Click the trash icon to clear the entire canvas

### Tips

- Your canvas state is automatically saved to browser local storage
- Refresh the page to restore your previous work
- Use the selection tool to move, resize, and rotate objects
- Double-click text to edit it
- Press Delete/Backspace while selecting an object to remove it

## Project Structure

```
/home/user/glowing-potato/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/
│   └── InfiniteCanvas.tsx    # Main canvas component
├── public/                   # Static assets
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── tailwind.config.ts        # Tailwind CSS config
├── next.config.ts            # Next.js config
└── README.md                 # This file
```

## Building for Production

```bash
npm run build
npm start
```

## Development

The canvas uses Fabric.js for object manipulation and rendering. All canvas state is serialized to JSON and stored in browser's local storage.

Key features:
- Infinite canvas with pan and zoom capabilities
- Real-time object manipulation
- Auto-save functionality
- Full TypeScript support
- Responsive design

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!
