# 📚 College Notes Organizer

A comprehensive, fully-featured web application for organizing college notes, files, and study materials with AI-powered assistance.

## Features

### Core Organization
- ✅ **Subject Management**: Create, edit, and delete subjects with metadata (code, professor, description)
- ✅ **Notes**: Add, edit, and delete typed notes with tags and dates
- ✅ **File Support**: Upload PDFs, images, and videos with descriptions
- ✅ **Folder Organization**: Create custom folders and organize files by folder or auto-type (PDFs, Images, Videos, Others)
- ✅ **Search**: Full-text search across subjects, notes, and files with auto-navigation and highlighting
- ✅ **Download**: Export entire subjects as ZIP files with all notes and files

### Folder Management (Advanced)
- 📂 **Sidebar Folder Tree**: View all folders with file counts for the selected subject
- 🎯 **Modal-based Operations**: User-friendly modals for creating folders and moving files (no prompts)
- 🖱️ **Drag-and-Drop**: Drag file cards directly onto folder headers to move files
- 📊 **Folder Icons**: Different icons for PDFs 📄, Images 🖼️, Videos 🎥, and Others 📦
- 🔢 **File Counts**: Display file counts next to each folder name in the Files tab

### AI-Powered Assistant
- 🤖 **Local Analysis**: Summarize notes and files without requiring an API key
- 📄 **Text Extraction**: 
  - **PDF.js**: Client-side PDF text extraction with page-level chunking (up to 100 pages)
  - **Tesseract.js**: OCR on images with confidence scores
- 🧠 **LLM Integration**: 
  - Direct OpenAI API (gpt-4o-mini) with client-side key storage
  - **Server Proxy Support**: Use `proxy:https://your-server.com/api/llm` format for secure LLM calls without exposing API keys
- ⏳ **Progress Indicators**: Real-time progress bar and status messages during extraction and LLM analysis
- 💡 **Smart Suggestions**: Study tips based on notes and file organization

### Authentication (Scaffolds)
- 🔐 **Email/Password**: Demo sign-up and sign-in with localStorage persistence
- 🔵 **Google OAuth**: Integration ready (requires client ID setup)
- 🟣 **Microsoft OAuth**: Integration ready (requires MSAL.js setup)

### UI/UX Polish
- 🎨 **Modern Design**: Gradient backgrounds, smooth animations, responsive layout
- 🌊 **Smooth Transitions**: Hover effects, slide animations, focus states
- 📱 **Drag-Drop Zones**: Visual feedback when dragging files over folder headers
- ♿ **Accessibility**: Focus styles, semantic HTML, keyboard navigation

## Getting Started

### Installation

1. **No build required** - this is a pure client-side app
2. Open `index.html` in a web browser
3. Or serve over HTTP/HTTPS for full functionality

### Usage

#### Creating a Subject
1. Click **"+ New Subject"** in the sidebar
2. Fill in subject name, code, professor, and description
3. Click **Add Subject**

#### Adding Notes
1. Select a subject from the sidebar
2. Click **"+ Add Note"** in the Notes tab
3. Enter title, date, content, and tags
4. Click **Save Note**

#### Uploading Files
1. Select a subject
2. Click **"📁 Upload File"**
3. Select files (PDFs, images, videos) or drag-drop them
4. Optionally select a folder or auto-assign by file type
5. Add a description if desired
6. Click **Upload Files**

#### Organizing with Folders
1. Click **"📂 New Folder"** to create a custom folder
2. **Move files** using the modal:
   - Right-click file → Move (or click the move button)
   - Select destination folder
   - Click Move File
3. **Drag-and-drop** files onto folder headers for quick moving
4. View folder counts in the sidebar and Files tab

#### Searching
1. Use the search box in the sidebar to search across all subjects
2. Or use the search in Notes/Files tabs for current subject
3. Results auto-scroll and highlight for easy navigation

#### Using the Study Assistant
1. Click **"Assistant"** button in the header
2. Select a subject from the dropdown
3. Click **"Analyze"** for local analysis or **"Analyze (LLM)"** for AI analysis
4. Optionally add an LLM API key:
   - Direct key: `sk-...` (OpenAI)
   - Server proxy: `proxy:https://your-server.com/api/llm`
5. Ask questions about the subject in the chat

## Data Storage

### Local Storage
- Subjects, notes metadata, and user authentication stored in browser's `localStorage`
- Persists across browser sessions
- Max ~5-10MB per domain (browser dependent)

### IndexedDB
- File binary data (base64) stored in IndexedDB object store `'files'`
- Provides much larger storage capacity (~50MB+)
- Used for PDF, image, and video data

### Export
- Download subjects as ZIP files with all notes and files
- Useful for backup or sharing

## API Integration

### OpenAI LLM (Direct)
1. Get an API key from [OpenAI](https://platform.openai.com)
2. In the Assistant modal, paste your key: `sk-...`
3. Click **Save Key** (stored locally)
4. Click **Analyze (LLM)** to use GPT-4o-mini for analysis

### Server-Proxied LLM (Recommended)
For production use, proxy LLM calls through your own server to keep API keys secure:

1. Set up a server endpoint (e.g., `/api/llm/analyze`) that:
   - Accepts POST requests with `{ subject, content, model, max_tokens }`
   - Calls OpenAI's API with your secret key
   - Returns `{ analysis: "..." }`

2. In the Assistant modal, enter: `proxy:https://your-server.com/api/llm/analyze`
3. Click **Save Key**
4. Click **Analyze (LLM)** - the app sends requests to your proxy

Example Node.js endpoint:
```javascript
app.post('/api/llm/analyze', async (req, res) => {
  const { subject, content, model, max_tokens } = req.body;
  const response = await openai.chat.completions.create({
    model: model || 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Analyze this study material:\n\n${content}`
    }],
    max_tokens: max_tokens || 800
  });
  res.json({ analysis: response.choices[0].message.content });
});
```

## Features Roadmap

- ✅ Multi-level folder organization (v1.0)
- ✅ Server-proxied LLM for secure API calls (v1.0)
- ✅ Progress indicators for long-running tasks (v1.0)
- ✅ Advanced OCR with page-level processing (v1.0)
- 📋 Collaborative note sharing
- 📋 Real-time sync across devices
- 📋 Advanced search filters and saved searches
- 📋 Spaced repetition study mode
- 📋 Note templates and quick links

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (responsive design)

## Performance Tips

1. **Large PDFs**: The app processes up to 100 pages per PDF. For larger documents, split them first.
2. **OCR**: Processing images with Tesseract takes a few seconds per image. Be patient or disable OCR for many images.
3. **Storage**: Regularly export and backup your subjects as ZIP files.
4. **Browser Limits**: Each browser domain has storage limits (~50MB IndexedDB). Consider clearing old data or using a server backend.

## Privacy

- 🔒 **No server calls** for notes/files storage (unless using LLM proxy)
- 🔒 **API keys stored locally** in browser localStorage (not sent to 3rd parties)
- 🔒 **All data stays in your browser** until exported

## Troubleshooting

### PDF text extraction returns empty
- PDF may be image-only. Try uploading it and using the Assistant's OCR feature.
- Some encrypted PDFs cannot be extracted. Try unencrypting first.

### OCR is slow
- First OCR call loads Tesseract (larger download). Subsequent calls are faster.
- For batch OCR, consider using a server-side solution.

### LLM returns error
- Check your API key format (`sk-...` for direct, `proxy:...` for proxied)
- Verify internet connection
- Check OpenAI account has sufficient credits
- For proxy, ensure server is accessible and endpoint responds with JSON

### Files not appearing after upload
- Check browser console for errors (F12)
- Verify storage quota not exceeded (IndexedDB or localStorage)
- Try clearing browser cache and reloading

## License

MIT - Feel free to use and modify for educational purposes.

## Credits

- **PDF.js**: Mozilla's PDF rendering library
- **Tesseract.js**: JavaScript OCR via Tesseract
- **JSZip**: Client-side ZIP file creation
- **OpenAI API**: GPT-4o-mini language model

---

**Happy studying! 📚✨**
