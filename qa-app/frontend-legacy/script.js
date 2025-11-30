document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const roleNameInput = document.getElementById('role-name');
    const behavioralTraitsInput = document.getElementById('behavioral-traits');
    const identityBackgroundInput = document.getElementById('identity-background');
    const personalityTraitsInput = document.getElementById('personality-traits');
    const languageStyleInput = document.getElementById('language-style');
    const characterSelect = document.getElementById('character-select');
    const imageInput = document.getElementById('image-input');
    const uploadButton = document.getElementById('upload-button');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const clearImageButton = document.getElementById('clear-image');

    let conversationHistory = [];
    let currentImageBase64 = null;
    let charactersData = [];

    // Fetch characters data
    fetch('characters.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Characters loaded:', data);
            charactersData = data;
            if (characterSelect) {
                data.forEach(char => {
                    const option = document.createElement('option');
                    option.value = char.id;
                    option.textContent = char.name;
                    characterSelect.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading characters:', error);
            // Only alert if characterSelect exists, otherwise it might be intentional removal
            if (characterSelect) {
                alert('无法加载角色列表，请确保您是通过 http://localhost:8888 访问的页面');
            }
        });

    // Handle character selection
    if (characterSelect) {
        characterSelect.addEventListener('change', (e) => {
            const selectedId = e.target.value;
            const selectedChar = charactersData.find(char => char.id === selectedId);

            if (selectedChar) {
                roleNameInput.value = selectedChar.roleName;
                behavioralTraitsInput.value = selectedChar.behavioralTraits;
                identityBackgroundInput.value = selectedChar.identityBackground;
                personalityTraitsInput.value = selectedChar.personalityTraits;
                languageStyleInput.value = selectedChar.languageStyle;
            } else {
                // Clear inputs if "Custom" is selected
                roleNameInput.value = '';
                behavioralTraitsInput.value = '';
                identityBackgroundInput.value = '';
                personalityTraitsInput.value = '';
                languageStyleInput.value = '';
            }
        });
    }

    // Function to update send button state
    function updateSendButtonState() {
        const hasText = chatInput.value.trim().length > 0;
        const hasImage = imageInput.files.length > 0 || currentImageBase64 !== null; // Check currentImageBase64 too
        sendButton.disabled = !(hasText || hasImage);
    }

    // Initial state
    updateSendButtonState();

    // Event listeners for state update
    chatInput.addEventListener('input', updateSendButtonState);
    imageInput.addEventListener('change', updateSendButtonState);

    uploadButton.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e_reader) => { // Renamed event to e_reader to avoid conflict with outer e
                currentImageBase64 = e_reader.target.result;
                imagePreview.src = currentImageBase64;
                imagePreviewContainer.style.display = 'flex';
                updateSendButtonState(); // Update state when image is selected
            };
            reader.readAsDataURL(file);
        } else {
            currentImageBase64 = null; // Clear base64 if file selection is cancelled
            updateSendButtonState(); // Update state if no file is selected
        }
    });

    clearImageButton.addEventListener('click', () => {
        imageInput.value = '';
        imagePreviewContainer.style.display = 'none';
        imagePreview.src = '';
        currentImageBase64 = null;
        updateSendButtonState();
    });

    const addMessage = (sender, text, image) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('content');

        if (image) {
            const img = document.createElement('img');
            img.src = image;
            img.style.maxWidth = '100%';
            img.style.borderRadius = '8px';
            img.style.marginBottom = '8px';
            contentDiv.appendChild(img);
        }

        if (text) {
            const textNode = document.createElement('div');
            textNode.textContent = text;
            contentDiv.appendChild(textNode);
        }

        messageDiv.appendChild(contentDiv);
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    async function sendMessage() {
        const question = chatInput.value.trim();

        if (!question && !currentImageBase64) return;

        addMessage('user', question, currentImageBase64);
        chatInput.value = '';
        imageInput.value = '';
        imagePreviewContainer.style.display = 'none';
        imagePreview.src = '';

        // Store image to send and clear current
        const imageToSend = currentImageBase64;
        currentImageBase64 = null;
        updateSendButtonState();

        const payload = {
            question: question,
            image: imageToSend, // Send base64 image
            history: conversationHistory,
            roleName: roleNameInput.value,
            behavioralTraits: behavioralTraitsInput.value,
            identityBackground: identityBackgroundInput.value,
            personalityTraits: personalityTraitsInput.value,
            languageStyle: languageStyleInput.value
        };

        try {
            const response = await fetch('http://localhost:8888/qa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP 错误！状态: ${response.status}`);
            }

            const data = await response.json();
            const answer = data.answer;

            addMessage('bot', answer);
            conversationHistory.push({ role: 'assistant', content: answer });

        } catch (error) {
            console.error('请求失败:', error);
            addMessage('bot', '抱歉，发生了一个错误。请稍后再试。');
        }
    };

    sendButton.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});
