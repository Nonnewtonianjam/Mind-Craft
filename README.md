# Mind-Craft 🧠✨

> Visual prompt construction meets Chrome's built-in AI - A powerful tool for thought organization and AI-assisted content synthesis

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat&logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Built with AI](https://img.shields.io/badge/Built_with-Chrome_AI-00897B?style=flat)](https://developer.chrome.com/docs/ai/)

##  What is Mind-Craft?

Mind-Craft is an innovative web application + Chrome extension that revolutionizes how you organize thoughts and create AI-generated content. By combining a visual node-based interface with Chrome's built-in AI APIs (Gemini Nano), it enables seamless capture, organization, and synthesis of information from across the web.

**Perfect for:** Research, content creation, brainstorming, studying, and anyone who needs to synthesize information from multiple sources.

##  Key Features

###  Visual Node Graph Canvas
- **Drag-and-drop node interface** powered by React Flow
- **Priority weighting system** (1-10) with color-coded borders
- **Root node system** to define your project's central premise
- **Skip functionality** to exclude specific nodes from AI generation
- **Connection system** to show logical flow between ideas

###  Chrome Extension Integration
- **Right-click context menu** - Send selected text or images instantly
- **Side panel interface** with quick capture buttons:
  - Text Selection
  - Page Summary (AI-powered)
  - Page Title
  - Screenshot
- **Keyboard shortcut** (Alt+Shift+M) for quick access
- **Real-time sync** between extension and web app

###  Chrome Built-in AI Integration
- **AI-Powered Titles** - Automatically generates concise, descriptive titles using Summarizer API
- **Page Summarization** - Extracts and condenses webpage content intelligently
- **Prompt API** - Comprehensive synthesis following your node structure
- **Writer API** - Formal writing mode for professional outputs
- Runs **100% locally** - No cloud API calls, your data stays private

###  Project Management
- **Auto-save** every 30 seconds
- **Save/Load/Export/Import** projects as JSON
- **Output history** with versioning
- **Demo templates** - Pre-loaded examples to get started

###  Smart Features
- **Markdown rendering** for outputs
- **Copy to clipboard** functionality
- **Merge nodes** - Combine multiple nodes into one
- **Structure-aware generation** - AI follows your node connections

##  Quick Start

### Prerequisites
- Node.js 18+ 
- Chrome 127+ or Chrome Dev/Canary (for AI features)
- Chrome's built-in AI enabled (see [Setup](#-ai-setup))

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/mind-craft.git
cd mind-craft
```

2. **Install dependencies**
```bash
npm install
```

3. **Run the development server**
```bash
npm run dev
```

4. **Open the app**
Navigate to [https://mind-craft-deploy.vercel.app](https://mind-craft-deploy.vercel.app)

### Chrome Extension Setup

1. **Load the extension**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `chrome-extension` folder from the project

2. **Enable the side panel**
   - Click the Mind-Craft extension icon
   - The side panel will open automatically

##  AI Setup

To enable AI features, you need Chrome's built-in AI:

1. **Check Chrome Version**
   - Ensure you're running Chrome 127+ (or Dev/Canary channel)
   - Check version at `chrome://version`

2. **Enable AI Features**
   - Go to `chrome://flags`
   - Search for **"Summarization API for Gemini Nano"**
   - Set to **"Enabled"**
   - Search for **"Prompt API for Gemini Nano"**
   - Set to **"Enabled"**
   - **Restart Chrome**

3. **Wait for Model Download**
   - Go to `chrome://components`
   - Find "Optimization Guide On Device Model"
   - The model will download automatically (may take a few minutes)
   - Check status - it should show "Up-to-date"

4. **Verify AI is Working**
   - Open the side panel console (right-click → Inspect)
   - Type: `typeof Summarizer`
   - Should return: `"function"`

##  How to Use

### Basic Workflow

1. **Create a Root Node**
   - Click "Add Node" on the canvas
   - Set it as root
   - Define your project's main topic

2. **Capture Content**
   - Use the Chrome extension to capture text, images, or summaries
   - Or manually add nodes on the canvas

3. **Organize Nodes**
   - Drag nodes to position them
   - Connect nodes to show relationships
   - Adjust priority weights (1-10)
   - Nodes with higher weights get more emphasis

4. **Generate Output**
   - Click "Generate" in the header
   - Choose mode: Generate, Summarize, or Write
   - AI follows your node structure and connections
   - View output in the right panel

5. **Save Your Work**
   - Projects auto-save every 30 seconds
   - Manually save with the "Save" button
   - Export as JSON for backup

### Pro Tips

- **Use connections wisely** - Connected nodes form a narrative flow
- **Isolated nodes** - Act as supporting references
- **Skip feature** - Exclude nodes without deleting them
- **Merge nodes** - Combine similar ideas for clarity
- **AI titles** - Let AI generate concise titles automatically
- **Output history** - Access previous generations anytime

##  Architecture

### Tech Stack
- **Frontend:** Next.js 15.5, React 18, JavaScript
- **UI:** React Flow, Tailwind CSS
- **State Management:** React Hooks
- **Chrome Extension:** Manifest V3
- **AI:** Chrome Built-in APIs (Gemini Nano)

### Project Structure
```
mind-craft/
├── app/
│   ├── api/
│   │   ├── capture/route.js    # Capture endpoint
│   │   └── nodes/route.js      # Nodes sync endpoint
│   ├── flow/page.js            # Main canvas page
│   └── page.js                 # Home redirect
├── components/
│   ├── Flow.js                 # Main canvas component
│   ├── PromptNode.js           # Text node component
│   ├── ImageNode.js            # Image node component
│   └── Toast.js                # Toast notifications
├── utils/
│   ├── nodeHelpers.js          # Node utilities
│   ├── promptHelpers.js        # Prompt building logic
│   ├── projectHelpers.js       # Save/load functions
│   ├── captureHelpers.js       # Position finding
│   └── demoTemplates.js        # Demo projects
├── chrome-extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── sidepanel.html
│   └── sidepanel.js
└── public/
    └── icon.png
```

## Use Cases

### Research & Study
- Capture key points from multiple articles
- Organize notes visually
- Generate comprehensive summaries
- Build connections between concepts

### Content Creation
- Collect inspiration from across the web
- Structure ideas visually
- Generate drafts based on research
- Iterate on content with AI assistance

### Brainstorming
- Capture ideas as they come
- Organize thoughts visually
- Find connections between ideas
- Synthesize into actionable plans

### Project Planning
- Gather requirements from multiple sources
- Organize project components
- Generate project documentation
- Track ideas and decisions


## 📝 License

MIT License - See LICENSE file for details
