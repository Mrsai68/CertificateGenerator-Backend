export const errorHandler = (err, req, res, next) => {
  // Always ensure CORS headers are set on error responses
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error('[Error Middleware]', err);

  let message = err.message || 'Internal Server Error';
  if (err.name === 'MongooseError' || err.message?.includes('buffering timed out') || err.message?.includes('connect ECONNREFUSED')) {
    message = 'Database Connection Error: Could not connect to MongoDB Atlas. Please verify MONGODB_URI in Vercel Environment Variables.';
  }

  res.status(statusCode).json({
    message,
    success: false,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
