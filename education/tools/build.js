const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_DIR = path.join(__dirname, '../txt');
const OUTPUT_ARTICLES_DIR = path.join(__dirname, '../articles');
const OUTPUT_INDEX_PATH = path.join(__dirname, '../index.html');
const SITE_ROOT = '../../'; // Relative path from articles to root
const EDUCATION_ROOT = '../'; // Relative path from articles to education root

// Ordered list of articles (filenames without extension)
const ARTICLE_ORDER = [
    'What-a-Period-Actually-Is',
    'The-Menstrual-Cycle-Explained-Simply',
    'What-Hormones-Are-Doing-During-Your-Cycle',
    'Why-Cycle-Length-Can-Change-From-Month-to-Month',
    'What-Normal-Periods-Really-Look-Like',
    'Why-Period-Symptoms-Can-Feel-Different-Every-Month',
    'Cramps-Why-They-Happen-and-Why-They-Vary',
    'Fatigue-Around-Your-Period',
    'Mood-Changes-Across-the-Cycle',
    'Spotting-vs-a-Period',
    'How-Stress-Shows-Up-in-Your-Cycle',
    'What-Tracking-Your-Cycle-Can-Help-You-Notice',
    'What-Tracking-Can’t-Predict',
    'How-Periods-Can-Change-Across-Life-Stages',
    'When-It-Makes-Sense-to-Talk-to-a-Doctor'
];

// Helper: Ensure directory exists
if (!fs.existsSync(OUTPUT_ARTICLES_DIR)) {
    fs.mkdirSync(OUTPUT_ARTICLES_DIR, { recursive: true });
}

// Helper: Slugify
function createSlug(filename) {
    const raw = filename.replace('.txt', '');
    return raw.toLowerCase()
        .replace(/_/g, '-')
        .replace(/\s+/g, '-')
        .replace(/['']/g, '') // remove apostrophes
        .replace(/[^a-z0-9-]/g, ''); // keep alphanumeric and hyphens
}

// Helper: Calculate reading time
function calculateReadingTime(text) {
    const words = text.split(/\s+/).length;
    return Math.max(3, Math.round(words / 200));
}

// Helper: Parse text content to HTML
function parseContent(text) {
    const lines = text.split('\n');
    let html = '';
    let inList = false;
    let title = '';

    // Try to find title in first line
    if (lines.length > 0 && lines[0].trim()) {
        title = lines[0].replace(/^\*\*|\*\*$/g, '').trim(); // Remove ** if present
    }

    // Skip title line for body parsing
    const bodyLines = lines.slice(1);

    for (let i = 0; i < bodyLines.length; i++) {
        let line = bodyLines[i].trim();

        if (!line) {
            if (inList) {
                html += '</ul>\n';
                inList = false;
            }
            continue; // Skip empty lines, they just delimit paragraphs
        }

        // Headers
        if (line.startsWith('###')) {
            if (inList) { html += '</ul>\n'; inList = false; }
            html += `<h3>${line.replace(/^###\s*/, '')}</h3>\n`;
        } else if (line.endsWith(':')) {
            // Treated as a sub-header or bold lead-in
            if (inList) { html += '</ul>\n'; inList = false; }
            html += `<h3>${line}</h3>\n`;
        }
        // Lists
        else if (line.startsWith('- ') || line.startsWith('• ')) {
            if (!inList) {
                html += '<ul class="article-list">\n';
                inList = true;
            }
            html += `  <li>${line.substring(2)}</li>\n`;
        }
        // Links
        else {
            if (inList) {
                html += '</ul>\n';
                inList = false;
            }

            // Parse [text](url) links
            line = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
            // Bold
            line = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

            // Separators
            if (line === '---') {
                html += '<hr class="article-divider">\n';
            } else {
                html += `<p>${line}</p>\n`;
            }
        }
    }

    // Close list if open
    if (inList) {
        html += '</ul>\n';
    }

    return { title, html };
}

// Template: General Page Layout
function renderPage(title, description, bodyContent, rootPath, isArticlePage) {
    const cssPath = isArticlePage ? '../../styles.css' : '../styles.css';
    const logoPath = isArticlePage ? '../../images/cyclevault-icon-light.png' : '../images/cyclevault-icon-light.png';
    const homeLink = isArticlePage ? '../../index.html' : '../index.html';
    const privacyLink = isArticlePage ? '../../privacy.html' : '../privacy.html';
    const contactLink = isArticlePage ? '../../contact.html' : '../contact.html';
    const educationLink = isArticlePage ? '../index.html' : 'index.html'; // relative to page

    // Navigation links (Need to point to root index logic or duplicate pages)
    // Since index.html has #hashes, we need to link to home#hash
    const navLinks = `
        <li><a href="${educationLink}" class="active">Education</a></li>
        <li><a href="${homeLink}#problem">Why?</a></li>
        <li><a href="${homeLink}#features">Features</a></li>
        <li><a href="${homeLink}#privacy">Privacy</a></li>
        <li><a href="${homeLink}#pricing">Pricing</a></li>
        <li><a href="${homeLink}#faq">FAQ</a></li>
    `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - The CycleVault Education</title>
    <meta name="description" content="${description}">
    <link rel="stylesheet" href="${cssPath}">
    <link rel="icon" type="image/png" href="${logoPath}">
    <style>
    <link rel="icon" type="image/png" href="${isArticlePage ? '../../images/cyclevault-icon-light.png' : '../images/cyclevault-icon-light.png'}">
</head>
<body>
    <header id="main-header">
        <div class="container header-container">
            <a href="${homeLink}" class="logo">
                <img src="${logoPath}" alt="CycleVault Logo" class="logo-icon">
                <span class="logo-text">The CycleVault</span>
            </a>
            <nav class="main-nav">
                <ul>
                    ${navLinks}
                </ul>
            </nav>
             <button id="theme-toggle" aria-label="Toggle Dark Mode" onclick="document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark'">
                <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            </button>
        </div>
    </header>

    <main>
        ${bodyContent}
    </main>

    <footer>
        <div class="container footer-container">
            <div class="footer-left">
                <span class="footer-logo">The CycleVault</span>
                <p class="copyright">&copy; 2025 The CycleVault. All rights reserved.</p>
            </div>
            <div class="footer-right">
                <a href="${privacyLink}">Privacy Policy</a>
                <a href="${contactLink}">Contact</a>
            </div>
        </div>
        <div class="container footer-disclaimer">
            <p>The CycleVault is not a medical device and does not provide medical advice. Consult a doctor for health concerns.</p>
        </div>
    </footer>
    <!-- Include main.js for fade-in animations and other interactivity -->
    <script src="${isArticlePage ? '../../main.js' : '../main.js'}"></script>
    <script>
        // Simple dark mode toggle script compatible with existing styles
        const toggleBtn = document.getElementById('theme-toggle');
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        
        let currentTheme = localStorage.getItem('theme');
        if (!currentTheme) {
            currentTheme = prefersDarkScheme.matches ? 'dark' : 'light';
        }
        document.body.setAttribute('data-theme', currentTheme);

        toggleBtn.addEventListener('click', function() {
            let theme = document.body.getAttribute('data-theme');
            let newTheme = theme === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    </script>
</body>
</html>`;
}

// Processing
console.log('Starting build...');

const processedArticles = [];

// 1. Process all files in the ordered list
ARTICLE_ORDER.forEach((baseName, index) => {
    const filePath = path.join(SOURCE_DIR, baseName + '.txt');
    if (!fs.existsSync(filePath)) {
        console.warn(`Warning: File not found: ${baseName}.txt`);
        return;
    }

    const rawText = fs.readFileSync(filePath, 'utf-8');
    const { title, html } = parseContent(rawText);
    const slug = createSlug(baseName) + '.html';
    const readingTime = calculateReadingTime(rawText);

    // First paragraph for excerpt
    // Strip HTML tags roughly for excerpt
    const plainText = html.replace(/<[^>]+>/g, ' ');
    let excerpt = plainText.substring(0, 160).trim();
    if (plainText.length > 160) excerpt += '...';

    processedArticles.push({
        baseName,
        title: title || baseName.replace(/-/g, ' '),
        slug,
        html,
        readingTime,
        excerpt,
        index
    });
});

// 2. Write Article Pages
processedArticles.forEach((article, i) => {
    const prev = i > 0 ? processedArticles[i - 1] : null;
    const next = i < processedArticles.length - 1 ? processedArticles[i + 1] : null;

    let navHtml = '<div class="nav-buttons">';
    if (prev) navHtml += `<a href="${prev.slug}" class="btn btn-secondary">← Previous</a>`;
    else navHtml += '<span></span>'; // spacer
    if (next) navHtml += `<a href="${next.slug}" class="btn btn-primary">Next Article →</a>`;
    else navHtml += '<span></span>';
    navHtml += '</div>';

    const body = `
        <div class="article-container fade-in">
            <a href="../index.html" class="back-link">← Back to Education</a>
            
            <h1 class="text-gradient">${article.title}</h1>
            
            <div class="article-meta">
                <span>The CycleVault Education</span>
                <span>•</span>
                <span>${article.readingTime} min read</span>
            </div>

            <div class="edu-disclaimer-box">
                <strong>Disclaimer:</strong> This content is for informational purposes only and does not replace medical advice. 
                If you have concerns about your health, consider speaking with a qualified healthcare professional.
            </div>

            <div class="article-content">
                ${article.html}
            </div>

            <div class="edu-support-note">
                Questions or corrections? Email <a href="mailto:support@thecyclevault.com" style="color:var(--primary)">support@thecyclevault.com</a>
            </div>

            ${navHtml}
            
            <div style="text-align: center; margin-top: 40px;">
                <a href="../index.html" class="back-link">Back to Education</a>
            </div>
        </div>
    `;

    const fullHtml = renderPage(article.title, article.excerpt, body, '../../', true);
    fs.writeFileSync(path.join(OUTPUT_ARTICLES_DIR, article.slug), fullHtml);
    console.log(`Generated: ${article.slug}`);
});

// 3. Write Landing Page (Education Index)
const landingBody = `
    <section class="edu-hero alt-bg">
        <div class="container narrow-container fade-in">
            <h1 class="text-gradient">Education</h1>
            <p class="hero-subhead">Plain-English menstrual health education.</p>
            
            <div class="edu-disclaimer-box" style="text-align: left; max-width: 700px; margin: 0 auto 20px;">
                <p style="margin-bottom: 0.5em; color: inherit;">The CycleVault Education content is for informational purposes only and does not replace medical advice. If you have concerns about your health, consider speaking with a qualified healthcare professional.</p>
                <p style="margin-bottom: 0; font-size: 0.85rem; opacity: 0.8;">If you believe something is incorrect or unclear, email <a href="mailto:support@thecyclevault.com" style="text-decoration: underline;">support@thecyclevault.com</a> and we’ll review it.</p>
            </div>
        </div>
    </section>

    <section class="section">
        <div class="container">
            <div class="grid grid-3">
                ${processedArticles.map((article, i) => `
                    <div class="card article-card fade-in delay-${(i % 3)}">
                        <div>
                            <h3 style="margin-bottom: 12px;">${article.title}</h3>
                            <p class="article-excerpt">${article.excerpt}</p>
                        </div>
                        <a href="articles/${article.slug}" class="read-link">Read Article →</a>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>
`;

const landingHtml = renderPage('Education', 'Plain-English menstrual health education.', landingBody, '../', false);
fs.writeFileSync(OUTPUT_INDEX_PATH, landingHtml);
console.log('Generated: index.html');

console.log('Build complete.');
