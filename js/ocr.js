// ocr.js - Tesseract.js OCR processing

let worker = null;

/**
 * Initialize Tesseract worker
 */
async function initOCR() {
    if (worker) {
        return worker;
    }

    try {
        console.log('Creating Tesseract worker...');

        // Create worker with correct v4 API
        worker = await Tesseract.createWorker({
            logger: m => console.log('Tesseract:', m.status, Math.round((m.progress || 0) * 100) + '%')
        });

        // Load and initialize English language
        await worker.loadLanguage('eng');
        await worker.initialize('eng');

        console.log('Tesseract worker initialized');
        return worker;
    } catch (error) {
        console.error('Failed to initialize OCR worker:', error);
        throw error;
    }
}

/**
 * Process an image file and extract text using OCR
 * @param {File|string} imageFile - Image file or data URL
 * @param {Function} progressCallback - Called with progress percentage (0-100)
 * @returns {Promise<string>} Extracted text
 */
async function processImage(imageFile, progressCallback = null) {
    try {
        // Ensure worker is initialized
        if (!worker) {
            console.log('Initializing OCR worker...');
            if (progressCallback) progressCallback(10);
            await initOCR();
            if (progressCallback) progressCallback(30);
        }

        console.log('Starting OCR processing...');
        if (progressCallback) progressCallback(40);

        // Perform OCR - simplified API call
        const result = await worker.recognize(imageFile);

        if (progressCallback) progressCallback(100);
        console.log('OCR completed. Confidence:', result.data.confidence);

        return {
            text: result.data.text,
            confidence: result.data.confidence,
            words: result.data.words
        };
    } catch (error) {
        console.error('OCR processing failed:', error);
        throw error;
    }
}

/**
 * Terminate the OCR worker to free up resources
 */
async function terminateWorker() {
    if (worker) {
        await worker.terminate();
        worker = null;
        console.log('Tesseract worker terminated');
    }
}

/**
 * Pre-process image for better OCR results
 * @param {File} imageFile - Image file to process
 * @returns {Promise<string>} Data URL of processed image
 */
async function preprocessImage(imageFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Resize if image is too large (max 2000px width)
                let width = img.width;
                let height = img.height;

                if (width > 2000) {
                    height = (height * 2000) / width;
                    width = 2000;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw image
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to grayscale for better OCR
                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                    data[i] = gray;
                    data[i + 1] = gray;
                    data[i + 2] = gray;
                }

                ctx.putImageData(imageData, 0, 0);

                // Return processed image as data URL
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };

            img.onerror = reject;
            img.src = e.target.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });
}
