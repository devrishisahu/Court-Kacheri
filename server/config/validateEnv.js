import ApiError from '../utils/ApiError.js';

/**
 * Validates that all required environment variables are set.
 * Call this BEFORE connecting to DB or starting the server.
 */
const REQUIRED_VARS = [
  { key: 'MONGO_URI', hint: 'MongoDB connection string' },
  { key: 'JWT_SECRET', hint: 'Secret key for signing JWTs' },
  { key: 'GEMINI_API_KEY', hint: 'Google Gemini API key for AI document analysis' },
];

const OPTIONAL_WITH_DEFAULTS = {
  PORT: '5000',
  NODE_ENV: 'development',
  JWT_EXPIRE: '30d',
  CORS_ORIGIN: '*',
};

const validateEnv = () => {
  const missing = [];

  for (const { key, hint } of REQUIRED_VARS) {
    if (!process.env[key] || process.env[key].trim() === '') {
      missing.push(`  • ${key} — ${hint}`);
    }
  }

  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:\n');
    console.error(missing.join('\n'));
    console.error('\nCreate a .env file with the above variables.\n');
    process.exit(1);
  }

  // Warn about default JWT_SECRET in production
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.JWT_SECRET === 'change_this_to_a_long_random_secret_key_in_production'
  ) {
    console.warn('⚠️  WARNING: Using default JWT_SECRET in production is insecure!');
  }

  // Set defaults for optional vars
  for (const [key, defaultValue] of Object.entries(OPTIONAL_WITH_DEFAULTS)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  }
};

export default validateEnv;
