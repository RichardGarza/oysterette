const fs = require('fs');
const path = require('path');

// Simple markdown to HTML converter (handles basic markdown)
function markdownToHtml(markdown) {
    let html = markdown
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Links
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
        // Unordered lists
        .replace(/^\- (.*$)/gim, '<li>$1</li>')
        .replace(/^  - (.*$)/gim, '<li style="margin-left: 20px;">$1</li>')
        // Horizontal rule
        .replace(/^---$/gim, '<hr>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        // Code blocks
        .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');

    // Wrap in paragraphs and clean up
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><h/g, '<h').replace(/<\/h([1-6])><\/p>/g, '</h$1>');
    html = html.replace(/<p><hr><\/p>/g, '<hr>');
    html = html.replace(/<p><li>/g, '<ul><li>').replace(/<\/li><\/p>/g, '</li></ul>');
    html = html.replace(/<\/ul><ul>/g, '');
    html = html.replace(/<p><pre>/g, '<pre>').replace(/<\/pre><\/p>/g, '</pre>');
    html = html.replace(/<p><\/p>/g, '');

    return html;
}

function createHtmlPage(title, content, backLink = 'index.html') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Oysterette</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.8;
            color: #333;
            background: #f8f9fa;
            padding: 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 60px;
        }

        .back-link {
            display: inline-block;
            color: #667eea;
            text-decoration: none;
            margin-bottom: 30px;
            font-weight: 500;
        }

        .back-link:hover {
            text-decoration: underline;
        }

        h1 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 2.5em;
        }

        h2 {
            color: #764ba2;
            margin-top: 40px;
            margin-bottom: 20px;
            font-size: 1.8em;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
        }

        h3 {
            color: #667eea;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.3em;
        }

        p {
            margin-bottom: 15px;
            color: #555;
        }

        ul {
            margin-left: 20px;
            margin-bottom: 20px;
        }

        li {
            margin-bottom: 10px;
            color: #555;
        }

        strong {
            color: #333;
            font-weight: 600;
        }

        a {
            color: #667eea;
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }

        hr {
            border: none;
            border-top: 1px solid #e9ecef;
            margin: 40px 0;
        }

        .meta {
            color: #999;
            font-size: 0.9em;
            margin-bottom: 40px;
        }

        .footer {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 1px solid #e9ecef;
            text-align: center;
            color: #999;
            font-size: 0.9em;
        }

        pre {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 20px 0;
        }

        code {
            font-family: "Monaco", "Courier New", monospace;
            font-size: 0.9em;
        }

        @media (max-width: 768px) {
            .container {
                padding: 30px 20px;
            }

            h1 {
                font-size: 2em;
            }

            h2 {
                font-size: 1.5em;
            }

            h3 {
                font-size: 1.2em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="${backLink}" class="back-link">← Back to Legal Documents</a>
        ${content}
        <div class="footer">
            <p>© 2025 Oysterette. All rights reserved.</p>
            <p><a href="index.html">Legal Documents</a> | <a href="mailto:support@oysterette.app">Contact Us</a></p>
        </div>
    </div>
</body>
</html>`;
}

// Convert Privacy Policy
const privacyMd = fs.readFileSync(path.join(__dirname, '../docs/PRIVACY_POLICY.md'), 'utf8');
const privacyHtml = markdownToHtml(privacyMd);
const privacyPage = createHtmlPage('Privacy Policy', privacyHtml);
fs.writeFileSync(path.join(__dirname, '../docs/privacy-policy.html'), privacyPage);
console.log('✅ Created privacy-policy.html');

// Convert Terms of Service
const termsMd = fs.readFileSync(path.join(__dirname, '../docs/TERMS_OF_SERVICE.md'), 'utf8');
const termsHtml = markdownToHtml(termsMd);
const termsPage = createHtmlPage('Terms of Service', termsHtml);
fs.writeFileSync(path.join(__dirname, '../docs/terms-of-service.html'), termsPage);
console.log('✅ Created terms-of-service.html');

// Convert Data Safety
const dataSafetyMd = fs.readFileSync(path.join(__dirname, '../docs/DATA_SAFETY_DISCLOSURE.md'), 'utf8');
const dataSafetyHtml = markdownToHtml(dataSafetyMd);
const dataSafetyPage = createHtmlPage('Data Safety Disclosure', dataSafetyHtml);
fs.writeFileSync(path.join(__dirname, '../docs/data-safety.html'), dataSafetyPage);
console.log('✅ Created data-safety.html');

console.log('\n🎉 All HTML files generated successfully!');
