const url = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

let pdfDoc = null,
    pageNum = 1,
    scale = 1.5,
    pageRendering = false,
    pageNumPending = null;

let sidebarVisible = false;

const container = document.getElementById('pdf-container');
const thumbnailsContainer = document.getElementById('thumbnails');

function renderPage(num, container) {
    pageRendering = true;
    return pdfDoc.getPage(num).then((page) => {
        const viewport = page.getViewport({scale: scale});
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };

        canvas.dataset.pageNumber = num;
        container.appendChild(canvas);

        return page.render(renderContext).promise.then(() => {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending, container);
                pageNumPending = null;
            }
            return canvas;
        });
    });
}

function renderAllPages() {
    container.innerHTML = '';
    const renderPromises = [];
    for (let num = 1; num <= pdfDoc.numPages; num++) {
        renderPromises.push(renderPage(num, container));
    }
    Promise.all(renderPromises).then(() => {
        console.log('All pages rendered');
        updatePageNum();
    });
}

function updatePageNum() {
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const canvases = container.querySelectorAll('canvas');
    
    for (let canvas of canvases) {
        const rect = canvas.getBoundingClientRect();
        if (rect.top <= containerHeight / 2 && rect.bottom >= containerHeight / 2) {
            pageNum = parseInt(canvas.dataset.pageNumber);
            document.getElementById('page-num').value = pageNum;
            break;
        }
    }
}

function onPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    const canvas = container.querySelector(`canvas[data-page-number="${pageNum}"]`);
    if (canvas) {
        canvas.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
}

function onNextPage() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    const canvas = container.querySelector(`canvas[data-page-number="${pageNum}"]`);
    if (canvas) {
        canvas.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
}

function renderThumbnails() {

    if (thumbnailsContainer.children.length > 0) {
        return;
    }

    thumbnailsContainer.innerHTML = '';
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        pdfDoc.getPage(i).then((page) => {
            const scale = 0.1;
            const viewport = page.getViewport({scale: scale});
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            page.render({
                canvasContext: ctx,
                viewport: viewport
            });

            canvas.onclick = () => {
                pageNum = i;
                const targetCanvas = container.querySelector(`canvas[data-page-number="${pageNum}"]`);
                if (targetCanvas) {
                    targetCanvas.scrollIntoView({behavior: 'smooth', block: 'start'});
                }
            };

            thumbnailsContainer.appendChild(canvas);
        });
    }
}

function updateZoom(newScale) {
    scale = newScale;
    renderAllPages();
}

pdfjsLib.getDocument(url).promise.then((doc) => {
    pdfDoc = doc;
    document.getElementById('page-count').textContent = `/ ${pdfDoc.numPages}`;
    renderAllPages();
    // renderThumbnails();
}).catch(error => {
    console.error('Error loading PDF:', error);
});

document.getElementById('prev-page').addEventListener('click', onPrevPage);
document.getElementById('next-page').addEventListener('click', onNextPage);

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedUpdatePageNum = debounce(updatePageNum, 10);
container.addEventListener('scroll', debouncedUpdatePageNum);

document.getElementById('zoom-in').addEventListener('click', () => {
    updateZoom(scale * 1.2);
});

document.getElementById('zoom-out').addEventListener('click', () => {
    updateZoom(scale / 1.2);
});

document.getElementById('zoom-select').addEventListener('change', (e) => {
    const selectedZoom = e.target.value;
    let newScale;
    if (selectedZoom === 'auto') {
        newScale = 1.5;
    } else if (selectedZoom === 'page-fit') {
        newScale = Math.min(container.clientWidth / pdfDoc.getPage(1).getViewport({scale: 1}).width,
                         container.clientHeight / pdfDoc.getPage(1).getViewport({scale: 1}).height);
    } else if (selectedZoom === 'page-width') {
        newScale = container.clientWidth / pdfDoc.getPage(1).getViewport({scale: 1}).width;
    } else {
        newScale = parseInt(selectedZoom) / 100;
    }
    updateZoom(newScale);
});

document.getElementById('toggle-sidebar').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebarVisible = !sidebarVisible;
    sidebar.style.display = sidebarVisible ? 'block' : 'none';
    
    if (sidebarVisible && thumbnailsContainer.children.length === 0) {
        renderThumbnails();
    }
});

document.getElementById('page-num').addEventListener('change', (e) => {
    const newPageNum = parseInt(e.target.value);
    if (newPageNum > 0 && newPageNum <= pdfDoc.numPages) {
        pageNum = newPageNum;
        const canvas = container.querySelector(`canvas[data-page-number="${pageNum}"]`);
        if (canvas) {
            canvas.scrollIntoView({behavior: 'smooth', block: 'start'});
        }
    }
});

// Placeholder functions for additional controls
document.getElementById('text-select').addEventListener('click', () => {
    console.log('Text selection tool clicked');
});

document.getElementById('hand-tool').addEventListener('click', () => {
    console.log('Hand tool clicked');
});

document.getElementById('download').addEventListener('click', () => {
    console.log('Download clicked');
});

document.getElementById('print').addEventListener('click', () => {
    console.log('Print clicked');
});