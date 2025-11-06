// Dynamic translation handler using Google Translate via backend
class PageTranslator {
    constructor() {
        this.currentLang = 'en';
        this.translations = {};
    }

    async translatePage(targetLang) {
        if (this.currentLang === targetLang) return;

        // Show loading indicator
        this.showLoadingIndicator();

        try {
            // Collect all text elements to translate
            const elements = this.collectTranslatableElements();
            
            // Send to backend for translation
            const response = await fetch('/api/translate/page', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    elements: elements,
                    target: targetLang
                })
            });

            if (!response.ok) {
                throw new Error('Translation failed');
            }

            const data = await response.json();
            
            // Apply translations to the page
            this.applyTranslations(data.translations);
            this.currentLang = targetLang;
            
            // Update language toggle button
            this.updateLanguageToggle(targetLang);

        } catch (error) {
            console.error('Translation error:', error);
            alert('Translation failed. Please try again.');
        } finally {
            this.hideLoadingIndicator();
        }
    }

    collectTranslatableElements() {
        const elements = {};
        let counter = 0;

        // Helper function to check if element should be translated
        const shouldTranslate = (el) => {
            return el.textContent.trim() && 
                   !el.classList.contains('no-translate') &&
                   !el.closest('.no-translate') &&
                   el.id !== 'language-toggle';
        };

        // Translate headings
        document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
            if (shouldTranslate(el)) {
                const key = `heading_${counter++}`;
                elements[key] = el.textContent.trim();
                el.setAttribute('data-translate-key', key);
            }
        });

        // Translate paragraphs
        document.querySelectorAll('p').forEach(el => {
            if (shouldTranslate(el)) {
                const key = `para_${counter++}`;
                elements[key] = el.textContent.trim();
                el.setAttribute('data-translate-key', key);
            }
        });

        // Translate buttons (excluding language toggle)
        document.querySelectorAll('button:not(#language-toggle):not(.no-translate)').forEach(el => {
            if (el.textContent.trim() && !el.closest('.no-translate')) {
                const key = `btn_${counter++}`;
                elements[key] = el.textContent.trim();
                el.setAttribute('data-translate-key', key);
            }
        });

        // Translate nav links (excluding language toggle)
        document.querySelectorAll('.nav-link:not(.no-translate)').forEach(el => {
            if (el.textContent.trim() && el.id !== 'language-toggle') {
                const key = `nav_${counter++}`;
                elements[key] = el.textContent.trim();
                el.setAttribute('data-translate-key', key);
            }
        });

        // Translate labels
        document.querySelectorAll('label').forEach(el => {
            if (shouldTranslate(el)) {
                const key = `label_${counter++}`;
                elements[key] = el.textContent.trim();
                el.setAttribute('data-translate-key', key);
            }
        });

        // Translate divs with specific classes
        document.querySelectorAll('.lead, .section-title').forEach(el => {
            if (shouldTranslate(el)) {
                const key = `div_${counter++}`;
                elements[key] = el.textContent.trim();
                el.setAttribute('data-translate-key', key);
            }
        });

        return elements;
    }

    applyTranslations(translations) {
        for (const [key, translatedText] of Object.entries(translations)) {
            const element = document.querySelector(`[data-translate-key="${key}"]`);
            if (element) {
                element.textContent = translatedText;
            }
        }
    }

    updateLanguageToggle(lang) {
        const toggleBtn = document.getElementById('language-toggle');
        if (toggleBtn) {
            if (lang === 'sw') {
                toggleBtn.innerHTML = '🌍 English';
                toggleBtn.setAttribute('data-lang', 'en');
                toggleBtn.classList.remove('btn-outline-secondary', 'btn-warning');
                toggleBtn.classList.add('btn-success');
            } else {
                toggleBtn.innerHTML = '🌍 Translate to Swahili';
                toggleBtn.setAttribute('data-lang', 'sw');
                toggleBtn.classList.remove('btn-success', 'btn-outline-secondary');
                toggleBtn.classList.add('btn-warning');
            }
        }
    }

    showLoadingIndicator() {
        const loader = document.createElement('div');
        loader.id = 'translation-loader';
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        loader.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Translating...</span>
                </div>
                <p style="margin-top: 10px;">Translating page...</p>
            </div>
        `;
        document.body.appendChild(loader);
    }

    hideLoadingIndicator() {
        const loader = document.getElementById('translation-loader');
        if (loader) {
            loader.remove();
        }
    }
}

// Initialize translator
const pageTranslator = new PageTranslator();

// Add language toggle functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Add click handler for language toggle
    const toggleBtn = document.getElementById('language-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const targetLang = this.getAttribute('data-lang');
            pageTranslator.translatePage(targetLang);
        });
    }
});
