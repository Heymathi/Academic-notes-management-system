// College Notes Organizer - Enhanced with File Support, IndexedDB & ZIP Export

class NotesOrganizer {
    constructor() {
        this.subjects = JSON.parse(localStorage.getItem('subjects')) || [];
        this.currentSubject = null;
        this.selectedFiles = [];
        this.db = null;
        this.initializeDB();
        this.initializeElements();
        this.attachEventListeners();
        this.renderSubjects();
    }

    // Initialize IndexedDB for file storage
    initializeDB() {
        const request = indexedDB.open('NotesOrganizerDB', 1);

        request.onerror = () => {
            console.log('Database failed to open');
        };

        request.onsuccess = () => {
            this.db = request.result;
            console.log('Database opened successfully');
        };

        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('files')) {
                db.createObjectStore('files', { keyPath: 'id' });
            }
        };
    }

    initializeElements() {
        // Modals
        this.addSubjectModal = document.getElementById('addSubjectModal');
        this.addNoteModal = document.getElementById('addNoteModal');
        this.uploadFileModal = document.getElementById('uploadFileModal');

        // Forms
        this.addSubjectForm = document.getElementById('addSubjectForm');
        this.addNoteForm = document.getElementById('addNoteForm');
        this.uploadFileForm = document.getElementById('uploadFileForm');

        // Buttons
        this.addSubjectBtn = document.getElementById('addSubjectBtn');
        this.addNoteBtn = document.getElementById('addNoteBtn');
        this.uploadFileBtn = document.getElementById('uploadFileBtn');
        this.downloadSubjectBtn = document.getElementById('downloadSubjectBtn');
        this.welcomeAddSubjectBtn = document.getElementById('welcomeAddSubjectBtn');

        // File upload elements
        this.fileUploadArea = document.getElementById('fileUploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.filePreview = document.getElementById('filePreview');

        // Screens
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.notesArea = document.getElementById('notesArea');

        // Lists and containers
        this.subjectList = document.getElementById('subjectList');
        this.notesList = document.getElementById('notesList');
        this.filesList = document.getElementById('filesList');
        this.selectedSubjectName = document.getElementById('selectedSubjectName');
        this.subjectInfo = document.getElementById('subjectInfo');

        // Search
        this.searchNotes = document.getElementById('searchNotes');

        // Tabs
        this.tabBtns = document.querySelectorAll('.tab-btn');

        // Close buttons
        this.closeButtons = document.querySelectorAll('.close');
    }

    attachEventListeners() {
        // Add subject button
        this.addSubjectBtn.addEventListener('click', () => this.openAddSubjectModal());
        this.welcomeAddSubjectBtn.addEventListener('click', () => this.openAddSubjectModal());

        // Add note button
        this.addNoteBtn.addEventListener('click', () => this.openAddNoteModal());

        // Upload file button
        this.uploadFileBtn.addEventListener('click', () => this.openUploadFileModal());

        // Download subject button
        this.downloadSubjectBtn.addEventListener('click', () => this.downloadSubjectFolder());

        // Form submissions
        this.addSubjectForm.addEventListener('submit', (e) => this.handleAddSubject(e));
        this.addNoteForm.addEventListener('submit', (e) => this.handleAddNote(e));
        this.uploadFileForm.addEventListener('submit', (e) => this.handleUploadFiles(e));

        // File upload handling
        this.fileUploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        this.fileUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.fileUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.fileUploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Close modals
        this.closeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
                if (e.target === this.uploadFileModal) {
                    this.selectedFiles = [];
                    this.filePreview.innerHTML = '';
                }
            }
        });

        // Search notes
        this.searchNotes.addEventListener('input', (e) => this.filterNotes(e.target.value));

        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    switchTab(tabName) {
        this.tabBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
    }

    openAddSubjectModal() {
        this.addSubjectForm.reset();
        this.addSubjectModal.classList.add('show');
    }

    openAddNoteModal() {
        if (!this.currentSubject) {
            alert('Please select a subject first!');
            return;
        }
        this.addNoteForm.reset();
        document.getElementById('noteDate').valueAsDate = new Date();
        this.addNoteModal.classList.add('show');
    }

    openUploadFileModal() {
        if (!this.currentSubject) {
            alert('Please select a subject first!');
            return;
        }
        this.uploadFileForm.reset();
        this.selectedFiles = [];
        this.filePreview.innerHTML = '';
        this.uploadFileModal.classList.add('show');
    }

    closeModal(modal) {
        if (modal) {
            modal.classList.remove('show');
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.fileUploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.fileUploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.fileUploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        this.handleFileSelect({ target: { files } });
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => this.isValidFileType(file));

        if (validFiles.length !== files.length) {
            alert('Some files were rejected. Only PDF, Images, and Videos are allowed.');
        }

        this.selectedFiles = validFiles;
        this.displayFilePreview();
    }

    isValidFileType(file) {
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 
                          'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
        const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.mp4', '.webm', '.avi', '.mov'];
        
        const hasValidType = validTypes.includes(file.type);
        const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        
        return hasValidType || hasValidExtension;
    }

    displayFilePreview() {
        this.filePreview.innerHTML = '';

        this.selectedFiles.forEach((file, index) => {
            const preview = document.createElement('div');
            preview.className = 'file-preview-item';

            const icon = this.getFileIcon(file);
            const size = (file.size / 1024).toFixed(2) + ' KB';

            preview.innerHTML = `
                <div class="file-preview-item-icon">${icon}</div>
                <div class="file-preview-item-info">
                    <div class="file-preview-item-name">${file.name}</div>
                    <div class="file-preview-item-size">${size}</div>
                </div>
                <button type="button" class="file-preview-item-remove">Remove</button>
            `;

            preview.querySelector('.file-preview-item-remove').addEventListener('click', () => {
                this.selectedFiles.splice(index, 1);
                this.displayFilePreview();
            });

            this.filePreview.appendChild(preview);
        });
    }

    getFileIcon(file) {
        if (file.type.startsWith('image/')) return '🖼️';
        if (file.type.startsWith('video/')) return '🎬';
        if (file.type === 'application/pdf') return '📄';
        return '📁';
    }

    getFileType(file) {
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'video';
        if (file.type === 'application/pdf') return 'pdf';
        return 'unknown';
    }

    handleUploadFiles(e) {
        e.preventDefault();

        if (this.selectedFiles.length === 0) {
            alert('Please select at least one file!');
            return;
        }

        if (!this.currentSubject) return;

        const description = document.getElementById('fileDescription').value;
        const subjectIndex = this.subjects.findIndex(s => s.id === this.currentSubject.id);

        if (subjectIndex === -1) return;

        let uploadCount = 0;

        this.selectedFiles.forEach(file => {
            const reader = new FileReader();

            reader.onload = (event) => {
                const fileData = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    type: this.getFileType(file),
                    size: file.size,
                    description: description,
                    data: event.target.result, // Base64 encoded data
                    uploadedAt: new Date().toISOString(),
                    folder: this.getFolderForFileType(this.getFileType(file)),
                    subjectId: this.currentSubject.id
                };

                // Save to localStorage
                this.subjects[subjectIndex].files.push(fileData);
                this.currentSubject.files = this.subjects[subjectIndex].files;
                this.saveToLocalStorage();

                // Also save to IndexedDB
                if (this.db) {
                    const transaction = this.db.transaction(['files'], 'readwrite');
                    const objectStore = transaction.objectStore('files');
                    objectStore.add(fileData);
                }

                uploadCount++;
                this.renderFiles();

                if (uploadCount === this.selectedFiles.length) {
                    alert('All files uploaded successfully!');
                }
            };

            reader.readAsDataURL(file);
        });

        this.selectedFiles = [];
        this.filePreview.innerHTML = '';
        this.closeModal(this.uploadFileModal);
        this.uploadFileForm.reset();
    }

    getFolderForFileType(type) {
        const folderMap = {
            'pdf': 'PDFs',
            'image': 'Images',
            'video': 'Videos',
            'unknown': 'Others'
        };
        return folderMap[type] || 'Others';
    }

    // Download entire subject folder as ZIP
    downloadSubjectFolder() {
        if (!this.currentSubject) {
            alert('Please select a subject first!');
            return;
        }

        const subject = this.currentSubject;
        const zip = new JSZip();

        // Create subject folder
        const subjectFolder = zip.folder(subject.name);

        // Add notes as text files
        if (subject.notes && subject.notes.length > 0) {
            const notesFolder = subjectFolder.folder('Notes');
            subject.notes.forEach((note, index) => {
                const noteContent = `
Title: ${note.title}
Date: ${note.date}
Tags: ${note.tags ? note.tags.join(', ') : 'No tags'}

Content:
${note.content}
                `;
                notesFolder.file(`Note_${index + 1}_${note.title.replace(/[^a-z0-9]/gi, '_')}.txt`, noteContent);
            });
        }

        // Add files organized by type
        if (subject.files && subject.files.length > 0) {
            const filesFolder = subjectFolder.folder('Files');

            // Organize by folder type
            const folders = {};
            subject.files.forEach(file => {
                const folder = file.folder || 'Others';
                if (!folders[folder]) folders[folder] = [];
                folders[folder].push(file);
            });

            Object.keys(folders).forEach(folderName => {
                const typeFolder = filesFolder.folder(folderName);
                folders[folderName].forEach(file => {
                    // Extract base64 data
                    const base64Data = file.data.split(',')[1] || file.data;
                    typeFolder.file(file.name, base64Data, { base64: true });
                });
            });
        }

        // Add subject info
        const infoContent = `
Subject Information
===================

Name: ${subject.name}
Code: ${subject.code || 'N/A'}
Professor: ${subject.professor || 'N/A'}
Description: ${subject.description || 'N/A'}

Created: ${new Date(subject.createdAt).toLocaleString()}

Total Notes: ${subject.notes ? subject.notes.length : 0}
Total Files: ${subject.files ? subject.files.length : 0}
        `;
        subjectFolder.file('Subject_Info.txt', infoContent);

        // Generate and download ZIP
        zip.generateAsync({ type: 'blob' }).then((content) => {
            const fileName = `${subject.name.replace(/[^a-z0-9]/gi, '_')}_backup.zip`;
            saveAs(content, fileName);
            alert('Subject folder downloaded successfully as ' + fileName);
        });
    }

    handleAddSubject(e) {
        e.preventDefault();

        const subject = {
            id: Date.now(),
            name: document.getElementById('subjectName').value,
            code: document.getElementById('subjectCode').value,
            professor: document.getElementById('professor').value,
            description: document.getElementById('subjectDescription').value,
            notes: [],
            files: [],
            createdAt: new Date().toISOString()
        };

        this.subjects.push(subject);
        this.saveToLocalStorage();
        this.renderSubjects();
        this.closeModal(this.addSubjectModal);
        this.addSubjectForm.reset();
    }

    handleAddNote(e) {
        e.preventDefault();

        if (!this.currentSubject) return;

        const note = {
            id: Date.now(),
            title: document.getElementById('noteTitle').value,
            content: document.getElementById('noteContent').value,
            date: document.getElementById('noteDate').value,
            tags: document.getElementById('noteTags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            createdAt: new Date().toISOString()
        };

        const subjectIndex = this.subjects.findIndex(s => s.id === this.currentSubject.id);
        if (subjectIndex !== -1) {
            this.subjects[subjectIndex].notes.push(note);
            this.saveToLocalStorage();
            this.currentSubject.notes.push(note);
            this.renderNotes();
            this.closeModal(this.addNoteModal);
            this.addNoteForm.reset();
        }
    }

    renderSubjects() {
        this.subjectList.innerHTML = '';

        if (this.subjects.length === 0) {
            this.subjectList.innerHTML = '<p style="padding: 1rem; color: #999; text-align: center;">No subjects yet</p>';
            this.showWelcomeScreen();
            return;
        }

        this.subjects.forEach(subject => {
            const subjectEl = document.createElement('div');
            subjectEl.className = 'subject-item';
            if (this.currentSubject && this.currentSubject.id === subject.id) {
                subjectEl.classList.add('active');
            }

            const filesCount = subject.files ? subject.files.length : 0;
            const notesCount = subject.notes ? subject.notes.length : 0;

            subjectEl.innerHTML = `
                <div class="subject-item-name">${subject.name}</div>
                ${subject.code ? `<div class="subject-item-code">${subject.code}</div>` : ''}
                <small style="color: #999; display: block; margin-top: 0.25rem;">📝 ${notesCount} | 📁 ${filesCount}</small>
                <button class="subject-item-delete" onclick="event.stopPropagation()">Delete</button>
            `;

            subjectEl.addEventListener('click', () => this.selectSubject(subject));
            subjectEl.querySelector('.subject-item-delete').addEventListener('click', () => this.deleteSubject(subject.id));

            this.subjectList.appendChild(subjectEl);
        });
    }

    selectSubject(subject) {
        this.currentSubject = subject;
        this.renderSubjects();
        this.renderNotes();
        this.renderFiles();
        this.showNotesArea();
    }

    deleteSubject(subjectId) {
        if (confirm('Are you sure you want to delete this subject? This action cannot be undone.')) {
            this.subjects = this.subjects.filter(s => s.id !== subjectId);
            this.saveToLocalStorage();
            if (this.currentSubject && this.currentSubject.id === subjectId) {
                this.currentSubject = null;
                this.showWelcomeScreen();
            }
            this.renderSubjects();
        }
    }

    renderNotes() {
        if (!this.currentSubject) return;

        this.selectedSubjectName.textContent = this.currentSubject.name;

        this.subjectInfo.classList.add('show');
        let infoHtml = '';
        if (this.currentSubject.code) {
            infoHtml += `<p><strong>Code:</strong> ${this.currentSubject.code}</p>`;
        }
        if (this.currentSubject.professor) {
            infoHtml += `<p><strong>Professor:</strong> ${this.currentSubject.professor}</p>`;
        }
        if (this.currentSubject.description) {
            infoHtml += `<p><strong>Description:</strong> ${this.currentSubject.description}</p>`;
        }
        const notesCount = this.currentSubject.notes ? this.currentSubject.notes.length : 0;
        const filesCount = this.currentSubject.files ? this.currentSubject.files.length : 0;
        infoHtml += `<p><strong>📝 Notes:</strong> ${notesCount} | <strong>📁 Files:</strong> ${filesCount}</p>`;
        this.subjectInfo.innerHTML = infoHtml;

        this.notesList.innerHTML = '';

        if (!this.currentSubject.notes || this.currentSubject.notes.length === 0) {
            this.notesList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #999;">No notes yet. Create your first note!</div>';
            return;
        }

        this.currentSubject.notes.forEach(note => {
            const noteEl = document.createElement('div');
            noteEl.className = 'note-card';

            const date = new Date(note.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            let tagsHtml = '';
            if (note.tags && note.tags.length > 0) {
                tagsHtml = note.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
            }

            noteEl.innerHTML = `
                <div class="note-card-date">${date}</div>
                <div class="note-card-title">${this.escapeHtml(note.title)}</div>
                <div class="note-card-content">${this.escapeHtml(note.content)}</div>
                ${tagsHtml ? `<div class="note-card-tags">${tagsHtml}</div>` : ''}
                <div class="note-card-actions">
                    <button class="btn-small btn-edit" onclick="event.stopPropagation()">Edit</button>
                    <button class="btn-small btn-delete" onclick="event.stopPropagation()">Delete</button>
                </div>
            `;

            noteEl.querySelector('.btn-edit').addEventListener('click', () => this.editNote(note));
            noteEl.querySelector('.btn-delete').addEventListener('click', () => this.deleteNote(note.id));

            this.notesList.appendChild(noteEl);
        });
    }

    renderFiles() {
        if (!this.currentSubject) return;

        this.filesList.innerHTML = '';

        if (!this.currentSubject.files || this.currentSubject.files.length === 0) {
            this.filesList.innerHTML = '<div class="empty-files-message"><p>📁 No files uploaded yet</p><p style="font-size: 0.9rem;">Click "📁 Upload File" to add PDFs, images, or videos</p></div>';
            return;
        }

        const folders = {};
        this.currentSubject.files.forEach(file => {
            const folder = file.folder || 'Others';
            if (!folders[folder]) folders[folder] = [];
            folders[folder].push(file);
        });

        Object.keys(folders).sort().forEach(folder => {
            folders[folder].forEach(file => {
                const fileEl = document.createElement('div');
                fileEl.className = 'file-card';

                const date = new Date(file.uploadedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });

                const size = (file.size / 1024).toFixed(2) + ' KB';
                const icon = this.getFileIcon({ type: this.getFileTypeFromName(file.type) });

                let previewHtml = '';
                if (file.type === 'image') {
                    previewHtml = `<img src="${file.data}" alt="${file.name}">`;
                } else if (file.type === 'video') {
                    previewHtml = `<video src="${file.data}" style="width: 100%; height: 100%; object-fit: cover;"></video>`;
                } else {
                    previewHtml = `<div class="file-card-icon">${icon}</div>`;
                }

                fileEl.innerHTML = `
                    <div class="file-card-preview">
                        ${previewHtml}
                    </div>
                    <div class="file-card-info">
                        <div class="file-card-name">${this.escapeHtml(file.name)}</div>
                        <div class="file-card-type">${file.type} • ${folder}</div>
                        <div class="file-card-size">${size} • ${date}</div>
                        ${file.description ? `<div class="file-card-description">${this.escapeHtml(file.description)}</div>` : ''}
                        <span class="file-status ${file.type}">${file.type.toUpperCase()}</span>
                        <div class="file-card-actions">
                            <button class="btn-small btn-view" onclick="event.stopPropagation()">View</button>
                            <button class="btn-small btn-download" onclick="event.stopPropagation()">Download</button>
                            <button class="btn-small file-card-delete" onclick="event.stopPropagation()">Delete</button>
                        </div>
                    </div>
                `;

                fileEl.querySelector('.btn-view').addEventListener('click', () => this.viewFile(file));
                fileEl.querySelector('.btn-download').addEventListener('click', () => this.downloadFile(file));
                fileEl.querySelector('.file-card-delete').addEventListener('click', () => this.deleteFile(file.id));

                this.filesList.appendChild(fileEl);
            });
        });
    }

    getFileTypeFromName(type) {
        if (type === 'image') return 'image/png';
        if (type === 'video') return 'video/mp4';
        if (type === 'pdf') return 'application/pdf';
        return 'application/octet-stream';
    }

    viewFile(file) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.style.zIndex = '2000';

        let content = '';
        if (file.type === 'image') {
            content = `<img src="${file.data}" style="max-width: 90%; max-height: 80vh; border-radius: 8px;">`;
        } else if (file.type === 'video') {
            content = `<video src="${file.data}" controls style="max-width: 90%; max-height: 80vh; border-radius: 8px;"></video>`;
        } else if (file.type === 'pdf') {
            content = `<embed src="${file.data}" type="application/pdf" style="width: 90%; height: 80vh; border-radius: 8px;">`;
        }

        modal.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); z-index: 2001;">
                <span class="close" style="cursor: pointer; font-size: 28px; float: right;">&times;</span>
                <div style="margin-top: 2rem;">
                    ${content}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector('.close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    downloadFile(file) {
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    deleteFile(fileId) {
        if (!this.currentSubject) return;

        const subjectIndex = this.subjects.findIndex(s => s.id === this.currentSubject.id);
        if (subjectIndex !== -1) {
            this.subjects[subjectIndex].files = this.subjects[subjectIndex].files.filter(f => f.id !== fileId);
            this.currentSubject.files = this.subjects[subjectIndex].files;
            this.saveToLocalStorage();
            this.renderFiles();
        }
    }

    filterNotes(searchTerm) {
        if (!this.currentSubject) return;

        const filtered = this.currentSubject.notes.filter(note =>
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
        );

        this.notesList.innerHTML = '';

        if (filtered.length === 0) {
            this.notesList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #999;">No notes found</div>';
            return;
        }

        filtered.forEach(note => {
            const noteEl = document.createElement('div');
            noteEl.className = 'note-card';

            const date = new Date(note.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            let tagsHtml = '';
            if (note.tags && note.tags.length > 0) {
                tagsHtml = note.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
            }

            noteEl.innerHTML = `
                <div class="note-card-date">${date}</div>
                <div class="note-card-title">${this.escapeHtml(note.title)}</div>
                <div class="note-card-content">${this.escapeHtml(note.content)}</div>
                ${tagsHtml ? `<div class="note-card-tags">${tagsHtml}</div>` : ''}
                <div class="note-card-actions">
                    <button class="btn-small btn-edit" onclick="event.stopPropagation()">Edit</button>
                    <button class="btn-small btn-delete" onclick="event.stopPropagation()">Delete</button>
                </div>
            `;

            noteEl.querySelector('.btn-edit').addEventListener('click', () => this.editNote(note));
            noteEl.querySelector('.btn-delete').addEventListener('click', () => this.deleteNote(note.id));

            this.notesList.appendChild(noteEl);
        });
    }

    editNote(note) {
        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteContent').value = note.content;
        document.getElementById('noteDate').value = note.date;
        document.getElementById('noteTags').value = note.tags ? note.tags.join(', ') : '';

        this.deleteNote(note.id);
        this.openAddNoteModal();
    }

    deleteNote(noteId) {
        if (!this.currentSubject) return;

        const subjectIndex = this.subjects.findIndex(s => s.id === this.currentSubject.id);
        if (subjectIndex !== -1) {
            this.subjects[subjectIndex].notes = this.subjects[subjectIndex].notes.filter(n => n.id !== noteId);
            this.currentSubject.notes = this.currentSubject.notes.filter(n => n.id !== noteId);
            this.saveToLocalStorage();
            this.renderNotes();
        }
    }

    showWelcomeScreen() {
        this.welcomeScreen.style.display = 'flex';
        this.notesArea.style.display = 'none';
    }

    showNotesArea() {
        this.welcomeScreen.style.display = 'none';
        this.notesArea.style.display = 'flex';
    }

    saveToLocalStorage() {
        localStorage.setItem('subjects', JSON.stringify(this.subjects));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NotesOrganizer();
});
