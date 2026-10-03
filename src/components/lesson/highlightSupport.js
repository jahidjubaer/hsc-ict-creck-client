// CSS Custom Highlight API (Chrome/Edge 105+, Safari 17.2+, Firefox 140+); the highlighter is hidden without it.
export const highlightSupported = typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined';
