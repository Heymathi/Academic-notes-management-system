// College Notes Organizer - Enhanced with File Support, IndexedDB & ZIP Export

class NotesOrganizer {
    constructor() {
        this.subjects = JSON.parse(localStorage.getItem('subjects')) || [];
        this.currentSubject = null;
        this.selectedFiles = [];
        this.db = null;
        this.user = null; // currently signed-in user object { email }
        this.initializeDB();
        this.initializeElements();
        this.attachEventListeners();
        this.renderSubjects();
        this.initAuth();
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
        this.uploadSubjectSelect = document.getElementById('uploadSubjectSelect');
        this.uploadFolderSelect = document.getElementById('uploadFolderSelect');
        this.newFolderBtn = document.getElementById('newFolderBtn');

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
        this.searchNotesBtn = document.getElementById('searchNotesBtn');
        this.searchSidebar = document.getElementById('searchSidebar');
        this.searchSidebarBtn = document.getElementById('searchSidebarBtn');

        // Tabs
        this.tabBtns = document.querySelectorAll('.tab-btn');

        // Close buttons
        this.closeButtons = document.querySelectorAll('.close');

        // Auth elements
        this.signInBtn = document.getElementById('signInBtn');
        this.signOutBtn = document.getElementById('signOutBtn');
        this.signInModal = document.getElementById('signInModal');
        this.signUpModal = document.getElementById('signUpModal');
        this.signInForm = document.getElementById('signInForm');
        this.signUpForm = document.getElementById('signUpForm');
        this.openSignUpLink = document.getElementById('openSignUpLink');
        this.googleSignInBtn = document.getElementById('googleSignInBtn');
        this.msSignInBtn = document.getElementById('msSignInBtn');
        this.authUserDisplay = document.getElementById('authUserDisplay');
        // Assistant
        this.helpBtn = document.getElementById('helpBtn');
        this.assistantModal = document.getElementById('assistantModal');
        this.assistantSubjectSelect = document.getElementById('assistantSubjectSelect');
        this.assistantAnalyzeBtn = document.getElementById('assistantAnalyzeBtn');
        this.assistantMessages = document.getElementById('assistantMessages');
        this.assistantInput = document.getElementById('assistantInput');
        this.assistantSendBtn = document.getElementById('assistantSendBtn');
        this.assistantAnalyzeLLMBtn = document.getElementById('assistantAnalyzeLLMBtn');
        this.assistantApiKeyInput = document.getElementById('assistantApiKey');
        this.assistantSaveKeyBtn = document.getElementById('assistantSaveKeyBtn');
        
        // Folder tree and modals
        this.folderTree = document.getElementById('folderTree');
        this.folderTreeList = document.getElementById('folderTreeList');
        this.createFolderModal = document.getElementById('createFolderModal');
        this.createFolderForm = document.getElementById('createFolderForm');
        this.moveFileModal = document.getElementById('moveFileModal');
        this.moveFileForm = document.getElementById('moveFileForm');
        this.moveFileDestinationSelect = document.getElementById('moveFileDestinationSelect');
    }

    attachEventListeners() {
        // Add subject button
        this.addSubjectBtn.addEventListener('click', () => this.openAddSubjectModal());
        this.welcomeAddSubjectBtn.addEventListener('click', () => this.openAddSubjectModal());

        // Add note button
        this.addNoteBtn.addEventListener('click', () => this.openAddNoteModal());

        // Upload file button
        this.uploadFileBtn.addEventListener('click', () => this.openUploadFileModal());

        // Form submissions
        this.addSubjectForm.addEventListener('submit', (e) => this.handleAddSubject(e));
        this.addNoteForm.addEventListener('submit', (e) => this.handleAddNote(e));
        this.uploadFileForm.addEventListener('submit', (e) => this.handleUploadFiles(e));

        // File upload handling
        this.fileUploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        if (this.uploadSubjectSelect) {
            this.uploadSubjectSelect.addEventListener('change', () => {
                const val = this.uploadSubjectSelect.value;
                console.log('Upload subject changed:', val);
                this.populateUploadFolderSelect(val);
            });
        }
        
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
        this.searchNotes.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearchNotes();
        });
        if (this.searchNotesBtn) {
            this.searchNotesBtn.addEventListener('click', () => this.performSearchNotes());
        }

        // Auth event listeners
        if (this.signInBtn) this.signInBtn.addEventListener('click', () => this.openSignInModal());
        if (this.signOutBtn) this.signOutBtn.addEventListener('click', () => this.signOut());
        if (this.signInForm) this.signInForm.addEventListener('submit', (e) => this.handleSignIn(e));
        if (this.signUpForm) this.signUpForm.addEventListener('submit', (e) => this.handleSignUp(e));
        if (this.openSignUpLink) this.openSignUpLink.addEventListener('click', (e) => { e.preventDefault(); this.openSignUpModal(); });
        if (this.googleSignInBtn) this.googleSignInBtn.addEventListener('click', () => {
            try { if (window.google && google.accounts && google.accounts.id) google.accounts.id.prompt(); } catch (err) { console.warn('Google Identity not initialized', err); }
        });
        if (this.msSignInBtn) this.msSignInBtn.addEventListener('click', () => this.handleMicrosoftSignIn());
        // Assistant events
        if (this.helpBtn) this.helpBtn.addEventListener('click', () => this.openAssistantModal());
        if (this.assistantAnalyzeBtn) this.assistantAnalyzeBtn.addEventListener('click', () => this.assistantAnalyze());
        if (this.assistantAnalyzeLLMBtn) this.assistantAnalyzeLLMBtn.addEventListener('click', () => this.assistantAnalyzeLLM());
        if (this.assistantSaveKeyBtn) this.assistantSaveKeyBtn.addEventListener('click', () => this.saveAssistantApiKey());
        if (this.assistantSendBtn) this.assistantSendBtn.addEventListener('click', () => this.handleAssistantQuery());
        // New Folder button
        if (this.newFolderBtn) this.newFolderBtn.addEventListener('click', () => this.createFolder());

        // Search subjects and files
        if (this.searchSidebar) {
            this.searchSidebar.addEventListener('input', (e) => this.filterSubjectsFiles(e.target.value));
            this.searchSidebar.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearchSidebar();
            });
        }
        if (this.searchSidebarBtn) {
            this.searchSidebarBtn.addEventListener('click', () => this.performSearchSidebar());
        }

        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Folder modals
        if (this.createFolderForm) this.createFolderForm.addEventListener('submit', (e) => this.handleCreateFolderModal(e));
        if (this.moveFileForm) this.moveFileForm.addEventListener('submit', (e) => this.handleMoveFileModal(e));
    }

    switchTab(tabName) {
        // Update tab buttons
        this.tabBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
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
            // allow opening without a selected subject; user can pick one or create new
            // alert removed to match user request for automatic handling
        }
        this.uploadFileForm.reset();
        this.selectedFiles = [];
        this.filePreview.innerHTML = '';
        // Populate subject select and default to current subject if available
        this.populateUploadSubjectSelect();
        if (this.currentSubject && this.uploadSubjectSelect) {
            this.uploadSubjectSelect.value = String(this.currentSubject.id);
            // populate folder select for the selected subject
            this.populateUploadFolderSelect(String(this.currentSubject.id));
        }
        this.uploadFileModal.classList.add('show');
    }

    populateUploadSubjectSelect() {
        if (!this.uploadSubjectSelect) return;
        // Clear and repopulate
        this.uploadSubjectSelect.innerHTML = '';

        // Option to create new subject
        const createOpt = document.createElement('option');
        createOpt.value = 'create_new';
        createOpt.textContent = '➕ Create New Subject...';
        this.uploadSubjectSelect.appendChild(createOpt);

        // Add existing subjects
        this.subjects.forEach(s => {
            const opt = document.createElement('option');
            opt.value = String(s.id);
            opt.textContent = `${s.name}${s.code ? ' (' + s.code + ')' : ''}`;
            this.uploadSubjectSelect.appendChild(opt);
        });

        // If no subjects, preselect create_new
        if (this.subjects.length === 0) this.uploadSubjectSelect.value = 'create_new';
        // Populate folder select for the currently selected subject
        if (this.uploadSubjectSelect) this.populateUploadFolderSelect(this.uploadSubjectSelect.value || (this.subjects[0] ? String(this.subjects[0].id) : null));
    }

    populateUploadFolderSelect(subjectId) {
        if (!this.uploadFolderSelect) return;
        this.uploadFolderSelect.innerHTML = '';
        // default options
        const optAuto = document.createElement('option'); optAuto.value = 'auto'; optAuto.textContent = 'Auto (by file type)';
        this.uploadFolderSelect.appendChild(optAuto);
        const optRoot = document.createElement('option'); optRoot.value = 'root'; optRoot.textContent = 'Root (no folder)';
        this.uploadFolderSelect.appendChild(optRoot);

        if (!subjectId || subjectId === 'create_new') return;
        const sId = Number(subjectId);
        const subj = this.subjects.find(s => s.id === sId);
        if (!subj) return;
        if (!subj.folders || !Array.isArray(subj.folders)) subj.folders = [];
        subj.folders.forEach(f => {
            const o = document.createElement('option'); o.value = f; o.textContent = f; this.uploadFolderSelect.appendChild(o);
        });
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
        console.log('handleFileSelect called', e);
        const files = Array.from(e.target.files || []);
        console.log('Selected files:', files.map(f => f.name));
        const validFiles = files.filter(file => this.isValidFileType(file));

        if (validFiles.length !== files.length) {
            console.warn('Some files were rejected due to invalid type');
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

        console.log('handleUploadFiles called, selectedFiles:', this.selectedFiles.length);

        if (this.selectedFiles.length === 0) {
            alert('Please select at least one file!');
            return;
        }

        if (!this.currentSubject) {
            alert('Please select a subject before uploading files.');
            return;
        }

        const description = document.getElementById('fileDescription') ? document.getElementById('fileDescription').value : '';

        // Determine which subject to save into (from modal select or currentSubject)
        let selectedSubjectId = null;
        if (this.uploadSubjectSelect) {
            selectedSubjectId = this.uploadSubjectSelect.value;
        } else if (this.currentSubject) {
            selectedSubjectId = String(this.currentSubject.id);
        }

        let subjectIndex = -1;

        if (selectedSubjectId === 'create_new' || !selectedSubjectId) {
            // Prompt user for a name for the new subject
            const newName = prompt('Enter name for new subject:', 'Imported');
            if (!newName) {
                alert('Upload cancelled: no subject specified');
                return;
            }
            const newSubject = {
                id: Date.now(),
                name: newName,
                code: '',
                professor: '',
                description: 'Created for imported files',
                notes: [],
                files: [],
                folders: [],
                createdAt: new Date().toISOString()
            };
            this.subjects.push(newSubject);
            this.saveToLocalStorage();
            subjectIndex = this.subjects.findIndex(s => s.id === newSubject.id);
            // Update sidebar and selectors to reflect new subject immediately
            this.renderSubjects();
            // Update upload select and currentSubject
            this.populateUploadSubjectSelect();
            this.currentSubject = this.subjects[subjectIndex];
        } else {
            // find by id
            const idNum = Number(selectedSubjectId);
            subjectIndex = this.subjects.findIndex(s => s.id === idNum);
            if (subjectIndex === -1) {
                console.error('Selected subject not found, aborting upload');
                alert('Selected subject not found. Please try again.');
                return;
            }
            // keep currentSubject in sync
            this.currentSubject = this.subjects[subjectIndex];
        }

        let uploadCount = 0;

        this.selectedFiles.forEach((file, idx) => {
            const reader = new FileReader();
            console.log('Reading file:', file.name);

            reader.onload = (event) => {
                try {
                    const fileData = {
                        id: Date.now() + Math.random(),
                        name: file.name,
                        type: this.getFileType(file),
                        size: file.size,
                        description: description,
                        data: event.target.result, // Base64 encoded data
                        uploadedAt: new Date().toISOString(),
                        folder: (this.uploadFolderSelect && this.uploadFolderSelect.value && this.uploadFolderSelect.value !== 'auto') ? (this.uploadFolderSelect.value === 'root' ? '' : this.uploadFolderSelect.value) : this.getFolderForFileType(this.getFileType(file)),
                        subjectId: this.currentSubject.id
                    };

                    // Save to localStorage (to the chosen subject)
                    this.subjects[subjectIndex].files.push(fileData);
                    // keep currentSubject in sync if it matches
                    if (this.currentSubject && this.currentSubject.id === this.subjects[subjectIndex].id) {
                        this.currentSubject.files = this.subjects[subjectIndex].files;
                    }
                    this.saveToLocalStorage();

                    // Also save to IndexedDB (if available)
                    if (this.db) {
                        const transaction = this.db.transaction(['files'], 'readwrite');
                        const objectStore = transaction.objectStore('files');
                        const req = objectStore.add(fileData);
                        req.onerror = (ev) => console.warn('IndexedDB add failed', ev);
                    }

                    uploadCount++;
                    this.renderFiles();

                    if (uploadCount === this.selectedFiles.length) {
                        console.log('All files uploaded successfully');
                        alert('All files uploaded successfully!');
                        // Update subject counts in the sidebar and info panels
                        this.renderSubjects();
                        this.renderNotes();
                    }
                } catch (err) {
                    console.error('Error processing file', file.name, err);
                }
            };

            reader.onerror = (err) => {
                console.error('FileReader error for', file.name, err);
            };

            reader.readAsDataURL(file);
        });

        this.selectedFiles = [];
        this.filePreview.innerHTML = '';
        this.closeModal(this.uploadFileModal);
        if (this.uploadFileForm) this.uploadFileForm.reset();
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
            folders: [],
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
            // Update sidebar counts for notes
            this.renderSubjects();
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
            const foldersCount = subject.folders ? subject.folders.length : 0;

            subjectEl.innerHTML = `
                <div class="subject-item-name">${subject.name}</div>
                ${subject.code ? `<div class="subject-item-code">${subject.code}</div>` : ''}
                <small style="color: #999; display: block; margin-top: 0.25rem;">📝 ${notesCount} | 📁 ${filesCount} | 🗂️ ${foldersCount}</small>
                <button class="subject-item-delete" onclick="event.stopPropagation()">Delete</button>
            `;

            subjectEl.addEventListener('click', () => this.selectSubject(subject));
            subjectEl.querySelector('.subject-item-delete').addEventListener('click', () => this.deleteSubject(subject.id));

            this.subjectList.appendChild(subjectEl);
        });

        // Keep upload modal select in sync
        this.populateUploadSubjectSelect();
    }

    selectSubject(subject) {
        this.currentSubject = subject;
        this.renderSubjects();
        this.renderNotes();
        this.renderFiles();
        this.renderFolderTree();
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

        // Show subject info
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
        const foldersCount = this.currentSubject.folders ? this.currentSubject.folders.length : 0;
        infoHtml += `<p><strong>📝 Notes:</strong> ${notesCount} | <strong>📁 Files:</strong> ${filesCount} | <strong>🗂️ Folders:</strong> ${foldersCount}</p>`;
        this.subjectInfo.innerHTML = infoHtml;

        // Render notes
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

        // Organize files by folder
        const folders = {};
        this.currentSubject.files.forEach(file => {
            const folder = file.folder || 'Others';
            if (!folders[folder]) folders[folder] = [];
            folders[folder].push(file);
        });

        // Ensure folders defined on the subject are present even if empty
        if (this.currentSubject.folders && Array.isArray(this.currentSubject.folders)) {
            this.currentSubject.folders.forEach(f => {
                if (!folders[f]) folders[f] = [];
            });
        }

        // Render files organized by folder (show folder heading then files)
        Object.keys(folders).sort().forEach(folder => {
            // folder header with icon
            const header = document.createElement('div');
            header.className = 'folder-header';
            header.dataset.folderName = folder;
            header.style.cursor = 'pointer';
            const fileCount = (folders[folder] || []).length;
            
            // Choose icon based on folder type
            let icon = '📁';
            if (folder === 'PDFs') icon = '📄';
            if (folder === 'Images') icon = '🖼️';
            if (folder === 'Videos') icon = '🎥';
            if (folder === 'Others') icon = '📦';
            
            header.innerHTML = `<h3 style="margin:0 0 0.5rem 0; display:flex; align-items:center; gap:0.5rem;">${icon} <span>${this.escapeHtml(folder || 'Root')}</span> <span style="color:#999; font-size:0.9rem;">(${fileCount} file${fileCount !== 1 ? 's' : ''})</span></h3>`;
            
            // Drag and drop handlers for folder header
            header.addEventListener('dragover', (e) => {
                e.preventDefault();
                header.style.backgroundColor = '#f0f4ff';
            });
            header.addEventListener('dragleave', (e) => {
                header.style.backgroundColor = '';
            });
            header.addEventListener('drop', (e) => {
                e.preventDefault();
                header.style.backgroundColor = '';
                const fileId = parseFloat(e.dataTransfer.getData('text/plain'));
                if (fileId) this.dropFileIntoFolder(fileId, folder);
            });
            
            this.filesList.appendChild(header);

            const filesInFolder = folders[folder] || [];
            if (filesInFolder.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'empty-files-message';
                empty.innerHTML = `<p style="margin:0 0 0.5rem 0;">📁 No files in this folder</p>`;
                this.filesList.appendChild(empty);
            }

            filesInFolder.forEach(file => {
                const fileEl = document.createElement('div');
                fileEl.className = 'file-card';
                fileEl.draggable = true;
                fileEl.dataset.fileId = file.id;
                fileEl.dataset.currentFolder = folder;

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
                            <button class="btn-small btn-move" onclick="event.stopPropagation()">Move</button>
                            <button class="btn-small file-card-delete" onclick="event.stopPropagation()">Delete</button>
                        </div>
                    </div>
                `;

                fileEl.querySelector('.btn-view').addEventListener('click', () => this.viewFile(file));
                fileEl.querySelector('.btn-download').addEventListener('click', () => this.downloadFile(file));
                const moveBtn = fileEl.querySelector('.btn-move');
                if (moveBtn) moveBtn.addEventListener('click', () => this.moveFile(file.id));
                fileEl.querySelector('.file-card-delete').addEventListener('click', () => this.deleteFile(file.id));
                
                // Drag start for file card
                fileEl.addEventListener('dragstart', (e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(file.id));
                });
                fileEl.addEventListener('dragend', (e) => {
                    // Reset any styling
                });

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
            this.renderSubjects();
        }
    }

    // Create a new folder inside the current subject (modal-based)
    createFolder() {
        if (!this.currentSubject) return alert('Select a subject first');
        if (this.createFolderForm) this.createFolderForm.reset();
        if (this.createFolderModal) this.createFolderModal.classList.add('show');
    }

    handleCreateFolderModal(e) {
        e.preventDefault();
        if (!this.currentSubject) return alert('Select a subject first');
        const name = (document.getElementById('folderNameInput') && document.getElementById('folderNameInput').value.trim()) || '';
        if (!name) return alert('Please enter a folder name');
        
        const subjIndex = this.subjects.findIndex(s => s.id === this.currentSubject.id);
        if (subjIndex === -1) return alert('Subject not found');
        const subj = this.subjects[subjIndex];
        if (!subj.folders) subj.folders = [];
        if (subj.folders.includes(name)) return alert('Folder already exists');
        
        subj.folders.push(name);
        this.subjects[subjIndex] = subj;
        this.currentSubject = subj;
        this.saveToLocalStorage();
        this.renderFiles();
        this.renderFolderTree();
        this.renderSubjects();
        this.populateUploadFolderSelect(String(this.currentSubject.id));
        this.closeModal(this.createFolderModal);
        alert(`Folder "${name}" created`);
    }

    // Move file to a folder (modal-based)
    moveFile(fileId) {
        if (!this.currentSubject) return alert('Select a subject first');
        const subjIndex = this.subjects.findIndex(s => s.id === this.currentSubject.id);
        if (subjIndex === -1) return alert('Subject not found');
        const subj = this.subjects[subjIndex];
        const file = subj.files.find(f => f.id === fileId);
        if (!file) return alert('File not found');
        
        // Store file ID temporarily for handler
        this.tempMoveFileId = fileId;
        
        // Populate destination folder select
        const select = this.moveFileDestinationSelect;
        if (select) {
            select.innerHTML = '';
            const optRoot = document.createElement('option'); optRoot.value = 'root'; optRoot.textContent = 'Root (no folder)';
            select.appendChild(optRoot);
            const available = (subj.folders || []).slice();
            ['PDFs','Images','Videos','Others'].forEach(d => { if (!available.includes(d)) available.push(d); });
            available.forEach(f => {
                const o = document.createElement('option'); o.value = f; o.textContent = f; select.appendChild(o);
            });
            select.value = file.folder || 'root';
        }
        
        if (this.moveFileModal) this.moveFileModal.classList.add('show');
    }

    handleMoveFileModal(e) {
        e.preventDefault();
        if (!this.currentSubject) return alert('Subject not found');
        const subjIndex = this.subjects.findIndex(s => s.id === this.currentSubject.id);
        if (subjIndex === -1) return alert('Subject not found');
        const subj = this.subjects[subjIndex];
        const file = subj.files.find(f => f.id === this.tempMoveFileId);
        if (!file) return alert('File not found');
        
        const choice = (this.moveFileDestinationSelect && this.moveFileDestinationSelect.value) || '';
        if (choice === 'root' || choice === '') {
            file.folder = '';
        } else {
            file.folder = choice;
            if (!subj.folders) subj.folders = [];
            if (!subj.folders.includes(choice)) subj.folders.push(choice);
        }
        
        this.subjects[subjIndex] = subj;
        this.currentSubject = subj;
        this.saveToLocalStorage();
        this.renderFiles();
        this.renderFolderTree();
        this.renderSubjects();
        this.closeModal(this.moveFileModal);
        this.tempMoveFileId = null;
    }

    // Handle file drop into folder (drag-and-drop)
    dropFileIntoFolder(fileId, folderName) {
        if (!this.currentSubject) return;
        const subjIndex = this.subjects.findIndex(s => s.id === this.currentSubject.id);
        if (subjIndex === -1) return;
        const subj = this.subjects[subjIndex];
        const file = subj.files.find(f => f.id === fileId);
        if (!file) return;
        
        if (folderName === 'root' || folderName === '') {
            file.folder = '';
        } else {
            file.folder = folderName;
            if (!subj.folders) subj.folders = [];
            if (!subj.folders.includes(folderName)) subj.folders.push(folderName);
        }
        
        this.subjects[subjIndex] = subj;
        this.currentSubject = subj;
        this.saveToLocalStorage();
        this.renderFiles();
        this.renderFolderTree();
        this.renderSubjects();
    }

    // Render folder tree in sidebar
    renderFolderTree() {
        if (!this.folderTree || !this.folderTreeList || !this.currentSubject) {
            if (this.folderTree) this.folderTree.style.display = 'none';
            return;
        }
        
        const folders = this.currentSubject.folders || [];
        if (folders.length === 0) {
            this.folderTree.style.display = 'none';
            return;
        }
        
        this.folderTree.style.display = 'block';
        this.folderTreeList.innerHTML = '';
        
        folders.forEach(folder => {
            const fileCount = (this.currentSubject.files || []).filter(f => (f.folder || 'Others') === folder).length;
            const folderEl = document.createElement('div');
            folderEl.style.cssText = 'padding:0.4rem 0.5rem; background:#f5f5f5; border-radius:4px; cursor:pointer; font-size:0.9rem; display:flex; justify-content:space-between; align-items:center;';
            folderEl.innerHTML = `
                <span>📂 ${this.escapeHtml(folder)} (${fileCount})</span>
            `;
            folderEl.addEventListener('click', () => {
                // Scroll to and highlight files in this folder
                const headers = this.filesList.querySelectorAll('.folder-header');
                for (let h of headers) {
                    if (h.textContent.includes(folder)) {
                        h.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        h.style.backgroundColor = '#fff3cd';
                        setTimeout(() => { h.style.backgroundColor = ''; }, 2000);
                        break;
                    }
                }
            });
            this.folderTreeList.appendChild(folderEl);
        });
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

    performSearchNotes() {
        const query = (this.searchNotes.value || '').trim().toLowerCase();
        if (!query) {
            alert('Please enter a search term');
            return;
        }

        if (!this.currentSubject) {
            alert('Please select a subject first');
            return;
        }

        const found = this.currentSubject.notes.find(note =>
            note.title.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query) ||
            (note.tags && note.tags.some(tag => tag.toLowerCase().includes(query)))
        );

        if (found) {
            this.filterNotes(query);
            setTimeout(() => {
                const foundNoteEl = Array.from(this.notesList.querySelectorAll('.note-card')).find(el =>
                    el.textContent.toLowerCase().includes(found.title.toLowerCase())
                );
                if (foundNoteEl) {
                    foundNoteEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    foundNoteEl.style.backgroundColor = '#fff3cd';
                    foundNoteEl.style.transition = 'background-color 0.3s ease';
                    setTimeout(() => { foundNoteEl.style.backgroundColor = ''; }, 2000);
                }
            }, 100);
            alert(`Found note: "${found.title}"`);
        } else {
            alert('Search not found - No matching notes in this subject');
        }
    }

    // Filter subjects (sidebar) and files (current subject) by query
    filterSubjectsFiles(query) {
        const q = (query || '').trim().toLowerCase();

        // Empty query -> reset views
        if (!q) {
            this.renderSubjects();
            if (this.currentSubject) {
                this.renderFiles();
                this.renderNotes();
            } else {
                this.filesList.innerHTML = '<div class="empty-files-message"><p>Select a subject to view files.</p></div>';
                this.notesList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #999;">Select a subject to view notes.</div>';
            }
            return;
        }

        // If no subject selected, search across subjects and show matching subjects in sidebar
        if (!this.currentSubject) {
            const matchingSubjects = this.subjects.filter(s => {
                const hay = (s.name + ' ' + (s.code||'') + ' ' + (s.professor||'') + ' ' + (s.description||'')).toLowerCase();
                if (hay.includes(q)) return true;
                // check in files
                if ((s.files || []).some(f => ((f.name||'') + ' ' + (f.description||'')).toLowerCase().includes(q))) return true;
                // check in notes
                if ((s.notes || []).some(n => ((n.title||'') + ' ' + (n.content||'') + ' ' + ((n.tags||[]).join(' '))).toLowerCase().includes(q))) return true;
                return false;
            });

            if (matchingSubjects.length === 0) {
                this.subjectList.innerHTML = '<p style="padding: 1rem; color: #999; text-align: center;">No subjects found</p>';
                this.filesList.innerHTML = '<div class="empty-files-message"><p>No matching results. Try a different search.</p></div>';
                this.notesList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #999;">No matching results.</div>';
                return;
            }

            // Render filtered subjects in sidebar
            this.renderFilteredSubjects(matchingSubjects);

            // Show instructions in main area
            this.filesList.innerHTML = '<div class="empty-files-message"><p>Select a subject from the results to view matching files.</p></div>';
            this.notesList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #999;">Select a subject from the results to view matching notes.</div>';
            return;
        }

        // Search inside the selected subject
        const matchingFiles = (this.currentSubject.files || []).filter(f => 
            (f.name || '').toLowerCase().includes(q) || 
            (f.description || '').toLowerCase().includes(q) ||
            (f.type || '').toLowerCase().includes(q)
        );
        const matchingNotes = (this.currentSubject.notes || []).filter(n => 
            (n.title || '').toLowerCase().includes(q) || 
            (n.content || '').toLowerCase().includes(q) ||
            (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
        );

        if (matchingFiles.length > 0) {
            this.renderFilesFiltered(matchingFiles);
            // Auto-scroll to first file
            setTimeout(() => {
                const firstFile = this.filesList.querySelector('.file-card');
                if (firstFile) {
                    firstFile.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstFile.style.backgroundColor = '#fff3cd';
                    firstFile.style.transition = 'background-color 0.3s ease';
                    setTimeout(() => { firstFile.style.backgroundColor = ''; }, 2000);
                }
            }, 100);
        } else {
            this.filesList.innerHTML = '<div class="empty-files-message"><p>Search not found - No matching files.</p></div>';
        }
        if (matchingNotes.length > 0) {
            this.renderNotesFiltered(matchingNotes);
            // Auto-scroll to first note
            setTimeout(() => {
                const firstNote = this.notesList.querySelector('.note-card');
                if (firstNote) {
                    firstNote.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstNote.style.backgroundColor = '#fff3cd';
                    firstNote.style.transition = 'background-color 0.3s ease';
                    setTimeout(() => { firstNote.style.backgroundColor = ''; }, 2000);
                }
            }, 100);
        } else {
            this.notesList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #999;">Search not found - No matching notes.</div>';
        }
    }

    // Render a filtered list of subjects in the sidebar (used by search)
    renderFilteredSubjects(subjectsArray) {
        this.subjectList.innerHTML = '';
        subjectsArray.forEach(subject => {
            const subjectEl = document.createElement('div');
            subjectEl.className = 'subject-item';

            const filesCount = subject.files ? subject.files.length : 0;
            const notesCount = subject.notes ? subject.notes.length : 0;
            const foldersCount = subject.folders ? subject.folders.length : 0;

            subjectEl.innerHTML = `
                <div class="subject-item-name">${this.escapeHtml(subject.name)}</div>
                ${subject.code ? `<div class="subject-item-code">${this.escapeHtml(subject.code)}</div>` : ''}
                <small style="color: #999; display: block; margin-top: 0.25rem;">📝 ${notesCount} | 📁 ${filesCount} | 🗂️ ${foldersCount}</small>
            `;

            subjectEl.addEventListener('click', () => this.selectSubject(subject));
            this.subjectList.appendChild(subjectEl);
        });
    }

    performSearchSidebar() {
        const query = (this.searchSidebar.value || '').trim().toLowerCase();
        if (!query) {
            alert('Please enter a search term');
            return;
        }

        if (!this.currentSubject) {
            alert('Please select a subject first.');
            return;
        }

        // Search within the current subject for any single character match
        const matchingFiles = (this.currentSubject.files || []).filter(f => 
            (f.name || '').toLowerCase().includes(query) || 
            (f.description || '').toLowerCase().includes(query) ||
            (f.type || '').toLowerCase().includes(query)
        );
        const matchingNotes = (this.currentSubject.notes || []).filter(n => 
            (n.title || '').toLowerCase().includes(query) || 
            (n.content || '').toLowerCase().includes(query) ||
            (n.tags && n.tags.some(t => t.toLowerCase().includes(query)))
        );

        const totalMatches = matchingFiles.length + matchingNotes.length;
        if (totalMatches === 0) {
            alert('Search not found');
            return;
        }

        if (matchingFiles.length > 0) {
            this.renderFilesFiltered(matchingFiles);
            // Auto-scroll and highlight first file
            setTimeout(() => {
                const firstFile = this.filesList.querySelector('.file-card');
                if (firstFile) {
                    firstFile.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstFile.style.backgroundColor = '#fff3cd';
                    firstFile.style.transition = 'background-color 0.3s ease';
                    setTimeout(() => { firstFile.style.backgroundColor = ''; }, 2000);
                }
            }, 100);
        } else {
            this.filesList.innerHTML = '<div class="empty-files-message"><p>Search not found</p></div>';
        }
        if (matchingNotes.length > 0) {
            this.renderNotesFiltered(matchingNotes);
            // Auto-scroll and highlight first note
            setTimeout(() => {
                const firstNote = this.notesList.querySelector('.note-card');
                if (firstNote) {
                    firstNote.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstNote.style.backgroundColor = '#fff3cd';
                    firstNote.style.transition = 'background-color 0.3s ease';
                    setTimeout(() => { firstNote.style.backgroundColor = ''; }, 2000);
                }
            }, 100);
        } else {
            this.notesList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #999;">Search not found</div>';
        }
        alert(`Found ${totalMatches} result(s): ${matchingFiles.length} file(s), ${matchingNotes.length} note(s)`);
    }

    // Render files given an array (used by search)
    renderFilesFiltered(filesArray) {
        this.filesList.innerHTML = '';

        if (!filesArray || filesArray.length === 0) {
            this.filesList.innerHTML = '<div class="empty-files-message"><p>📁 No files uploaded yet</p><p style="font-size: 0.9rem;">Try clearing the search.</p></div>';
            return;
        }

        // group by folder for filtered results
        const folders = {};
        filesArray.forEach(file => {
            const folder = file.folder || 'Others';
            if (!folders[folder]) folders[folder] = [];
            folders[folder].push(file);
        });

        Object.keys(folders).sort().forEach(folder => {
            const header = document.createElement('div');
            header.className = 'folder-header';
            header.innerHTML = `<h3 style="margin:0 0 0.5rem 0;">${this.escapeHtml(folder || 'Root')}</h3>`;
            this.filesList.appendChild(header);

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
                    <div class="file-card-type">${file.type} • ${file.folder || 'Others'}</div>
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
                const moveBtn = fileEl.querySelector('.btn-move');
                if (moveBtn) moveBtn.addEventListener('click', () => this.moveFile(file.id));
                fileEl.querySelector('.file-card-delete').addEventListener('click', () => this.deleteFile(file.id));
                
                // Drag start for file card
                fileEl.addEventListener('dragstart', (e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(file.id));
                });
                fileEl.addEventListener('dragend', (e) => {
                    // Reset any styling
                });

                this.filesList.appendChild(fileEl);
            });
        });
    }

    renderNotesFiltered(notesArray) {
        this.notesList.innerHTML = '';

        if (!notesArray || notesArray.length === 0) {
            this.notesList.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #999;">Search not found</div>';
            return;
        }

        notesArray.forEach(note => {
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
            // Refresh sidebar counts after deleting a note
            this.renderSubjects();
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

    /* -------------------- Authentication helpers -------------------- */
    initAuth() {
        try {
            const stored = JSON.parse(localStorage.getItem('authUser'));
            if (stored && stored.email) {
                this.user = stored;
            }
        } catch (e) {
            this.user = null;
        }
        this.updateAuthUI();

        // Initialize Google Identity and MSAL (if available). Replace client IDs below.
        this.initGoogleSignIn();
        this.initMSAL();
        console.log('Auth initialized, user=', this.user);
    }

    openSignInModal() {
        if (this.signInForm) this.signInForm.reset();
        if (this.signInModal) this.signInModal.classList.add('show');
    }

    openSignUpModal() {
        if (this.signUpForm) this.signUpForm.reset();
        if (this.signUpModal) this.signUpModal.classList.add('show');
    }

    handleSignUp(e) {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value.trim().toLowerCase();
        const password = document.getElementById('signupPassword').value;
        console.log('handleSignUp', email);
        if (!email || !password) return alert('Please fill email and password');

        // NOTE: This is a simple client-side demo only. Do NOT use in production.
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.some(u => u.email === email)) return alert('User already exists. Please sign in.');
        users.push({ email, password });
        localStorage.setItem('users', JSON.stringify(users));
        // auto-login after sign up
        this.user = { email };
        localStorage.setItem('authUser', JSON.stringify(this.user));
        this.updateAuthUI();
        this.closeModal(this.signUpModal);
        alert('Account created and signed in');
    }

    handleSignIn(e) {
        e.preventDefault();
        try {
            const email = document.getElementById('signinEmail').value.trim().toLowerCase();
            const password = document.getElementById('signinPassword').value;
            console.log('handleSignIn attempt', email);
            if (!email || !password) return alert('Please fill email and password');

            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const found = users.find(u => u.email === email && u.password === password);
            if (!found) {
                console.warn('SignIn failed for', email);
                return alert('Invalid credentials — please check email and password or sign up first.');
            }

            this.user = { email };
            localStorage.setItem('authUser', JSON.stringify(this.user));
            this.updateAuthUI();
            this.closeModal(this.signInModal);
            alert('Signed in');
        } catch (err) {
            console.error('Error in handleSignIn', err);
            alert('An error occurred while signing in. Check the console for details.');
        }
    }

    signOut() {
        this.user = null;
        localStorage.removeItem('authUser');
        // if using Google, optionally revoke
        try { if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect(); } catch (e) {}
        this.updateAuthUI();
        alert('Signed out');
    }

    updateAuthUI() {
        if (this.user && this.user.email) {
            if (this.authUserDisplay) this.authUserDisplay.textContent = this.user.email;
            if (this.signInBtn) this.signInBtn.style.display = 'none';
            if (this.signOutBtn) this.signOutBtn.style.display = 'inline-block';
        } else {
            if (this.authUserDisplay) this.authUserDisplay.textContent = '';
            if (this.signInBtn) this.signInBtn.style.display = 'inline-block';
            if (this.signOutBtn) this.signOutBtn.style.display = 'none';
        }
    }

    /* -------------------- Assistant -------------------- */
    openAssistantModal() {
        // populate subjects
        if (this.assistantSubjectSelect) {
            this.assistantSubjectSelect.innerHTML = '';
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = '-- Select Subject --';
            this.assistantSubjectSelect.appendChild(opt);
            this.subjects.forEach(s => {
                const o = document.createElement('option'); o.value = String(s.id); o.textContent = s.name; this.assistantSubjectSelect.appendChild(o);
            });
        }
        if (this.assistantModal) this.assistantModal.classList.add('show');
    }

    assistantAnalyze() {
        const sid = this.assistantSubjectSelect ? this.assistantSubjectSelect.value : null;
        if (!sid) return alert('Please select a subject to analyze');
        const subject = this.subjects.find(s => String(s.id) === String(sid));
        if (!subject) return alert('Subject not found');
        const summary = this.generateSubjectSummary(subject);
        this.appendAssistantMessage(summary);
    }

    handleAssistantQuery() {
        const q = this.assistantInput ? this.assistantInput.value.trim() : '';
        if (!q) return;
        this.appendAssistantMessage(q, true);
        // Simple canned understanding: if subject selected, use notes/files to answer
        const sid = this.assistantSubjectSelect ? this.assistantSubjectSelect.value : null;
        const subject = this.subjects.find(s => String(s.id) === String(sid));
        setTimeout(() => {
            const reply = this.generateReplyForQuery(q, subject);
            this.appendAssistantMessage(reply);
        }, 300);
        if (this.assistantInput) this.assistantInput.value = '';
    }

    appendAssistantMessage(text, isUser = false) {
        if (!this.assistantMessages) return;
        const el = document.createElement('div');
        el.className = 'assistant-message' + (isUser ? ' assistant-user' : '');
        el.textContent = text;
        this.assistantMessages.appendChild(el);
        this.assistantMessages.scrollTop = this.assistantMessages.scrollHeight;
    }

    showProgress(message = 'Processing...') {
        const prog = document.getElementById('assistantProgress');
        const txt = document.getElementById('assistantProgressText');
        if (prog && txt) {
            txt.textContent = message;
            prog.style.display = 'block';
        }
    }

    hideProgress() {
        const prog = document.getElementById('assistantProgress');
        if (prog) prog.style.display = 'none';
    }

    updateProgressBar(percent) {
        const fill = document.querySelector('#assistantProgressFill');
        if (fill) fill.style.width = percent + '%';
    }

    generateSubjectSummary(subject) {
        if (!subject) return 'No subject provided.';
        const notesCount = (subject.notes || []).length;
        const filesCount = (subject.files || []).length;
        const topNotes = (subject.notes || []).slice(0,3).map(n => `- ${n.title}`).join('\n');
        const topFiles = (subject.files || []).slice(0,5).map(f => `- ${f.name}`).join('\n');
        let advice = '';
        if (notesCount === 0 && filesCount === 0) {
            advice = 'No notes or files found. Start by adding notes or uploading PDFs/images/videos.';
        } else {
            advice = `I found ${notesCount} note(s) and ${filesCount} file(s).\n`;
            if (notesCount > 0) advice += `Top notes:\n${topNotes}\n`;
            if (filesCount > 0) advice += `Top files:\n${topFiles}\n`;
            advice += '\nSuggestions:\n- Merge short notes on the same topic into one document.\n- Use the Download button to export subject data.\n- Remove duplicate or outdated files.\n- Tag notes with keywords for easier search.';
        }
        return advice;
    }

    generateReplyForQuery(q, subject) {
        const low = q.toLowerCase();
        if (!subject) {
            if (low.includes('how') || low.includes('start') || low.includes('help')) return 'Select a subject from the dropdown and click Analyze, or ask a question like "summarize notes".';
            return 'Please select a subject to let me use its notes and files when answering.';
        }
        if (low.includes('summarize') || low.includes('summary')) {
            return this.generateSubjectSummary(subject);
        }
        if (low.includes('clear') || low.includes('delete') || low.includes('remove')) {
            return 'To clear notes: go to the subject, delete notes you no longer need, or download a ZIP first to keep a backup.';
        }
        if (low.includes('justify') || low.includes('explain')) {
            return 'I can suggest why a note/file is relevant. Try asking: "Why is [note title] important?" after selecting the subject.';
        }
        // Default: show available items
        return this.generateSubjectSummary(subject);
    }

    /* -------------------- Text extraction and LLM integration -------------------- */
    async extractTextFromSubjectFiles(subject) {
        if (!subject) return '';
        const texts = [];
        const fileCount = (subject.files || []).length;
        
        for (let i = 0; i < fileCount; i++) {
            const f = subject.files[i];
            try {
                if (!f.data) continue;
                
                // Update progress while processing files
                const progress = 10 + (i / fileCount) * 40;
                this.updateProgressBar(Math.min(50, progress));
                this.showProgress(`Extracting text (${i + 1}/${fileCount})...`);
                
                if (f.type === 'pdf' || (f.name && f.name.toLowerCase().endsWith('.pdf'))) {
                    // Use PDF.js to extract text with chunking for large PDFs
                    try {
                        const pdfData = atob(f.data.split(',')[1]);
                        const uint8 = new Uint8Array(pdfData.length);
                        for (let j = 0; j < pdfData.length; j++) uint8[j] = pdfData.charCodeAt(j);
                        const loadingTask = window.pdfjsLib.getDocument({ data: uint8 });
                        const pdf = await loadingTask.promise;
                        let full = '';
                        
                        // Chunk large PDFs: process max 50 pages at a time
                        const pageChunks = [];
                        for (let p = 1; p <= Math.min(pdf.numPages, 100); p++) {
                            try {
                                const page = await pdf.getPage(p);
                                const txt = await page.getTextContent();
                                const pageText = txt.items.map(item => item.str || '').join(' ');
                                full += '\n[Page ' + p + ']\n' + pageText;
                                
                                // If this page is mostly blank or very short, skip
                                if (pageText.trim().length < 20) full = full.slice(0, -pageText.length);
                            } catch (err) {
                                console.warn('Failed to extract page', p, 'from', f.name);
                            }
                        }
                        
                        if (full.trim().length > 0) {
                            texts.push(`PDF: ${f.name}\n` + full);
                        }
                    } catch (err) {
                        console.warn('PDF extraction failed for', f.name, err);
                    }
                } else if (f.type === 'image' || (f.name && (f.name.match(/\.jpg$|\.jpeg$|\.png$|\.gif$/i)))) {
                    // Use Tesseract.js for OCR with improved settings
                    try {
                        const worker = Tesseract.createWorker({
                            logger: () => {} // Suppress verbose logging
                        });
                        await worker.load();
                        await worker.loadLanguage('eng');
                        await worker.initialize('eng');
                        
                        // Enable high confidence recognition
                        await worker.setParameters({
                            tessedit_pageseg_mode: 3 // Auto page segmentation
                        });
                        
                        const res = await worker.recognize(f.data);
                        await worker.terminate();
                        
                        const confidence = res.data && res.data.confidence ? res.data.confidence : 0;
                        const ocrText = res.data && res.data.text ? res.data.text : '';
                        
                        if (ocrText.trim().length > 0) {
                            texts.push(`Image: ${f.name} (confidence: ${confidence}%)\n` + ocrText);
                        }
                    } catch (err) {
                        console.warn('OCR failed for', f.name, err);
                    }
                } else {
                    // Other types: use description or name
                    texts.push(`${f.name}: ${f.description || ''}`);
                }
            } catch (err) {
                console.error('Error extracting text from file', f.name, err);
            }
        }
        
        return texts.join('\n\n');
    }

    summarizeTextLocal(text, maxSentences = 6) {
        if (!text) return 'No extractable text found.';
        // Very simple summarization: split into sentences, pick first N and most frequent keywords
        const sentences = text.split(/[\.\n]+/).map(s => s.trim()).filter(Boolean);
        const summary = sentences.slice(0, maxSentences).join('. ') + (sentences.length > maxSentences ? '...' : '');
        // Keywords (naive)
        const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
        const freq = {};
        words.forEach(w => freq[w] = (freq[w] || 0) + 1);
        const keywords = Object.keys(freq).sort((a,b) => freq[b]-freq[a]).slice(0,6).join(', ');
        return `Summary:\n${summary}\n\nTop keywords: ${keywords}`;
    }

    async assistantAnalyzeLLM() {
        const sid = this.assistantSubjectSelect ? this.assistantSubjectSelect.value : null;
        if (!sid) return alert('Please select a subject to analyze');
        const subject = this.subjects.find(s => String(s.id) === String(sid));
        if (!subject) return alert('Subject not found');
        
        this.showProgress('Extracting text from files...');
        this.updateProgressBar(10);
        const extracted = await this.extractTextFromSubjectFiles(subject);
        this.updateProgressBar(50);
        
        if (!extracted) {
            this.hideProgress();
            this.appendAssistantMessage('No text found in files; try uploading PDFs or images with text.');
            return;
        }
        
        const apiKey = (this.assistantApiKeyInput && this.assistantApiKeyInput.value) || localStorage.getItem('assistantApiKey');
        if (!apiKey) {
            this.hideProgress();
            this.showProgress('Running local summarization...');
            this.updateProgressBar(75);
            const local = this.summarizeTextLocal(extracted);
            this.updateProgressBar(100);
            this.hideProgress();
            this.appendAssistantMessage(local);
            return;
        }
        
        this.showProgress('Sending text to LLM for analysis...');
        this.updateProgressBar(60);
        try {
            const prompt = `You are an assistant that summarizes and analyzes study material. Provide a concise summary, key points, and suggested study actions.\nSubject: ${subject.name}\n\nContent:\n` + extracted.slice(0, 20000);
            
            // Check if using server proxy (API key starts with 'proxy:')
            let resp;
            if (apiKey.startsWith('proxy:')) {
                // Server-proxied request
                const proxyUrl = apiKey.substring(6); // Remove 'proxy:' prefix
                resp = await fetch(proxyUrl || '/api/llm/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subject: subject.name,
                        content: extracted.slice(0, 20000),
                        model: 'gpt-4o-mini',
                        max_tokens: 800
                    })
                });
            } else {
                // Direct OpenAI API call
                resp = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 800 })
                });
            }
            
            this.updateProgressBar(80);
            if (!resp.ok) {
                const errText = await resp.text();
                console.error('LLM API error', errText);
                this.hideProgress();
                this.appendAssistantMessage('LLM API returned an error. Check console.');
                return;
            }
            
            const data = await resp.json();
            let text;
            if (apiKey.startsWith('proxy:') && data.analysis) {
                // Server response format
                text = data.analysis;
            } else {
                // OpenAI response format
                text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || JSON.stringify(data);
            }
            
            this.updateProgressBar(100);
            this.hideProgress();
            this.appendAssistantMessage(text);
        } catch (err) {
            console.error('Error calling LLM', err);
            this.hideProgress();
            this.appendAssistantMessage('Error calling LLM — see console for details.');
        }
    }

    async assistantAnalyze() {
        const sid = this.assistantSubjectSelect ? this.assistantSubjectSelect.value : null;
        if (!sid) return alert('Please select a subject to analyze');
        const subject = this.subjects.find(s => String(s.id) === String(sid));
        if (!subject) return alert('Subject not found');
        this.appendAssistantMessage('Extracting text from files...');
        const extracted = await this.extractTextFromSubjectFiles(subject);
        if (!extracted) {
            this.appendAssistantMessage('No text found in files; try uploading PDFs or images with text.');
            return;
        }
        const summary = this.summarizeTextLocal(extracted);
        this.appendAssistantMessage(summary);
    }

    saveAssistantApiKey() {
        try {
            const k = this.assistantApiKeyInput ? this.assistantApiKeyInput.value.trim() : '';
            if (!k) return alert('Please paste an API key or leave blank to remove.');
            localStorage.setItem('assistantApiKey', k);
            alert('API key saved locally (stored in browser).');
        } catch (err) { console.error(err); alert('Failed saving API key'); }
    }

    // Google Identity (client-side) - requires you to create an OAuth Client ID and replace CLIENT_ID
    initGoogleSignIn() {
        try {
            if (!window.google || !google.accounts || !google.accounts.id) return;
            // Replace with your Google OAuth client ID
            const GOOGLE_CLIENT_ID = 'REPLACE_WITH_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: (resp) => this.handleGoogleCredentialResponse(resp),
            });
            // Render a Google button inside our placeholder div (optional)
            try {
                google.accounts.id.renderButton(
                    this.googleSignInBtn,
                    { theme: 'outline', size: 'large' }
                );
            } catch (err) {
                // If render fails, it's okay — clicking the placeholder will call prompt()
            }
        } catch (err) {
            console.warn('Google Identity initialization failed', err);
        }
    }

    handleGoogleCredentialResponse(response) {
        if (!response || !response.credential) return;
        const payload = this.parseJwt(response.credential);
        if (payload && payload.email) {
            this.user = { email: payload.email };
            localStorage.setItem('authUser', JSON.stringify(this.user));
            this.updateAuthUI();
            this.closeModal(this.signInModal);
            alert(`Signed in as ${payload.email}`);
        } else {
            console.warn('Google sign-in returned no email', payload);
        }
    }

    // MSAL (Microsoft) client-side example - replace CLIENT_ID with your app registration
    initMSAL() {
        try {
            if (!window.msal) return;
            const MSAL_CLIENT_ID = 'REPLACE_WITH_MICROSOFT_CLIENT_ID';
            this.msalInstance = new msal.PublicClientApplication({
                auth: { clientId: MSAL_CLIENT_ID }
            });
        } catch (err) {
            console.warn('MSAL initialization failed', err);
        }
    }

    async handleMicrosoftSignIn() {
        try {
            if (!this.msalInstance) return alert('MSAL is not initialized. Add your client ID in the script.');
            const loginResp = await this.msalInstance.loginPopup({ scopes: ['User.Read'] });
            if (loginResp && loginResp.account && loginResp.account.username) {
                this.user = { email: loginResp.account.username };
                localStorage.setItem('authUser', JSON.stringify(this.user));
                this.updateAuthUI();
                this.closeModal(this.signInModal);
                alert(`Signed in as ${loginResp.account.username}`);
            }
        } catch (err) {
            console.error('Microsoft login failed', err);
            alert('Microsoft sign-in failed. Check console for details and ensure MSAL client ID is configured.');
        }
    }

    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
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
