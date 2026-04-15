export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  const message = err.message || 'An unexpected error occurred';

  // Multer-specific errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: `Maximum file size is ${process.env.MAX_FILE_SIZE_MB || 100}MB`,
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Unexpected file field',
      message: 'Use the "audio" field to upload your file',
    });
  }

  console.error(`[ERROR] ${status}: ${message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  return res.status(status).json({
    error: err.name || 'ServerError',
    message,
  });
}
