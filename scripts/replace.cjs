const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const replaceInlineStyleWithClass = (html, styleRegex, classToAdd) => {
    return html.replace(new RegExp(`(<[^>]+?)(style="[^"]*?)(${styleRegex.source})([^"]*")`, 'g'), (match, tagStart, styleStart, styleMatch, styleEnd) => {
        let classMatch = tagStart.match(/class="([^"]*)"/);
        let newTagStart = tagStart;
        if (classMatch) {
            let existingClasses = classMatch[1];
            if (!existingClasses.includes(classToAdd)) {
                newTagStart = tagStart.replace(`class="${existingClasses}"`, `class="${existingClasses} ${classToAdd}"`);
            }
        } else {
            // Need to insert class attribute before the style attribute
            // We'll just append it to the end of tagStart.
            // But wait, tagStart doesn't end with a space sometimes.
            newTagStart = tagStart.replace(/ $/, '') + ` class="${classToAdd}" `;
        }
        
        let newStyle = styleStart + styleEnd;
        if (newStyle.match(/style="\s*"/)) {
            newStyle = '';
        }
        
        return newTagStart + newStyle;
    });
};

html = replaceInlineStyleWithClass(html, /display:\s*flex;\s*flex-direction:\s*column;?\s*/, 'flex-col');
html = replaceInlineStyleWithClass(html, /display:\s*flex;\s*align-items:\s*center;?\s*/, 'flex-row-center');
html = replaceInlineStyleWithClass(html, /display:\s*flex;\s*justify-content:\s*center;?\s*/, 'flex-row-center justify-center');
html = replaceInlineStyleWithClass(html, /color:\s*var\(--md-sys-color-error\);?\s*/, 'text-error');
html = replaceInlineStyleWithClass(html, /color:\s*var\(--md-sys-color-tertiary\);?\s*/, 'text-warning');
html = replaceInlineStyleWithClass(html, /background:\s*rgba\([^)]+\);?\s*/, 'surface-input');
html = replaceInlineStyleWithClass(html, /background-color:\s*rgba\([^)]+\);?\s*/, 'surface-input');

fs.writeFileSync('index.html', html);
console.log('Replaced styles in index.html');
