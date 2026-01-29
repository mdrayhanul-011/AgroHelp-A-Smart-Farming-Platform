require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const ALLOWED_MODELS = new Set(['gemini-1.5-pro', 'gemini-1.5-flash']);


const PORT = process.env.PORT || 5000;
const DEFAULT_URI = 'mongodb://127.0.0.1:27017/agrohelp';
const MONGO_URI = (process.env.MONGO_URI && process.env.MONGO_URI.trim()) || DEFAULT_URI;
const JWT_SECRET = (process.env.JWT_SECRET && process.env.JWT_SECRET.trim()) || 'dev-secret-change-me';
const ORIGIN = process.env.ORIGIN || 'http://localhost:5173';

const app = express();
// Middleware
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use('/api/ai', rateLimit({ windowMs: 60_000, max: 30 })); // 30 req/min/IP


// MongoDB connection setup
let db, Users, Stories, Questions;
(async () => {
  try {
    const client = new MongoClient(MONGO_URI, { ignoreUndefined: true });
    await client.connect();
    db = client.db();
    AdvisoryCollection = db.collection('advisories');
    Users = db.collection('users');
    Stories = db.collection('stories');
    MarketCollection = db.collection('markets');
    InputCollection = db.collection('inputs');
    Questions = db.collection('questions');

    await Questions.createIndex({ expertId: 1, createdAt: -1 }).catch(() => { });
    await Questions.createIndex({ askerId: 1, createdAt: -1 }).catch(() => { });
    await InputCollection.createIndex({ category: 1, product: 1 });
    await InputCollection.createIndex({ region: 1 });

    await Users.createIndex({ username: 1 }, { unique: true }).catch(() => { });
    await Users.createIndex({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } }).catch(() => { });

    console.log('MongoDB connected:', MONGO_URI);
  } catch (err) {
    console.error('Mongo error:', err);
    process.exit(1);
  }
})();

function getRetryAfterSeconds(err) {
  try {
    const details = err?.errorDetails || [];
    const retryInfo = details.find(d => d['@type']?.includes('RetryInfo'));
    if (retryInfo?.retryDelay) {
      const m = String(retryInfo.retryDelay).match(/([\d.]+)s/);
      if (m) return Math.ceil(parseFloat(m[1]));
    }
  } catch {}
  return null;
}

function trimPrompt(p, maxChars = 4000) {
  return String(p || '').slice(0, maxChars);
}


// --- Authentication Helpers ---
const sign = (user) =>
  jwt.sign(
    {
      id: user._id ? user._id.toString() : user.id,
      username: user.username,
      designation: user.designation || 'user',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

const sanitizeUser = (u) => ({
  id: u._id ? u._id.toString() : u.id,
  name: u.name || null,
  username: u.username || null,
  email: u.email || null,
  photoUrl: u.photoUrl || null,
  phone: u.phone || null,
  address: u.address || null,
  designation: u.designation || 'user',
  specialty: u.specialty || null,   // <- add
  region: u.region || null,         // <- add
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});


const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1]; // Extract the token from the header
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const payload = jwt.verify(token, JWT_SECRET);  // Verify the token
    const user = await Users.findOne({ _id: new ObjectId(payload.id) }, { projection: { passwordHash: 0 } });
    if (!user) return res.status(401).json({ message: 'Invalid token' });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};



// Admin middleware
const adminOnly = (req, res, next) => {
  if (!req.user || (req.user.designation !== 'admin')) {
    return res.status(403).json({ message: 'Admin only' });
  }
  next();
};

const expertOnly = (req, res, next) => {
  if (!req.user || (req.user.designation !== 'expert' && req.user.designation !== 'admin')) {
    return res.status(403).json({ message: 'Expert only' });
  }
  next();
};


// --- Gemini AI Routes ---

// POST /api/ai/gemini/chat
// Body: { prompt: string, system?: string, model?: 'gemini-1.5-pro' | 'gemini-1.5-flash' }
// NOTE: If you want to require login, add `auth` as middleware.
// POST /api/ai/gemini/chat
// Body: { prompt: string, system?: string, model?: 'gemini-1.5-flash' | 'gemini-1.5-pro' }
app.post('/api/ai/gemini/chat', async (req, res) => {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ message: 'Server missing GOOGLE_API_KEY' });
    }

    let { prompt, system, model } = req.body || {};
    prompt = trimPrompt(prompt);
    if (!prompt) return res.status(400).json({ message: 'prompt is required' });

    // default to FLASH for better free-tier headroom
    let modelName =
      (model && ALLOWED_MODELS.has(String(model))) ? String(model)
      : (process.env.GEMINI_MODEL || 'gemini-1.5-flash');

    const sys =
      system ||
      'You are an agriculture assistant for Bangladeshi farmers. Be concise and practical.';

    const callOnce = async (mname) => {
      const m = genAI.getGenerativeModel({ model: mname, systemInstruction: sys });
      const result = await m.generateContent([{ text: prompt }]);
      return result?.response?.text?.() || '';
    };

    try {
      const text = await callOnce(modelName);
      return res.json({ ok: true, text, model: modelName });
    } catch (err) {
      const is429 = err?.status === 429;
      const askedPro = modelName === 'gemini-1.5-pro';

      if (is429 && askedPro) {
        // fall back to flash once
        try {
          const text = await callOnce('gemini-1.5-flash');
          return res.json({ ok: true, text, model: 'gemini-1.5-flash', fallback: true });
        } catch (err2) {
          const retry = getRetryAfterSeconds(err2) || getRetryAfterSeconds(err) || 60;
          res.set('Retry-After', String(retry));
          return res.status(429).json({
            message: 'Gemini quota exceeded. Try again later.',
            retryAfter: retry,
            modelTried: 'gemini-1.5-pro',
          });
        }
      }

      if (is429) {
        const retry = getRetryAfterSeconds(err) || 60;
        res.set('Retry-After', String(retry));
        return res.status(429).json({
          message: 'Gemini quota exceeded. Try again later.',
          retryAfter: retry,
          modelTried: modelName,
        });
      }

      console.error('Gemini chat error:', err?.response?.data || err);
      return res.status(500).json({ message: 'Gemini request failed' });
    }
  } catch (err) {
    console.error('Gemini chat handler error:', err);
    return res.status(500).json({ message: 'Gemini request failed' });
  }
});


// (Optional) POST /api/ai/gemini/vision
// Body: { prompt: string, imageBase64: string, mimeType?: string, model?: string }
app.post('/api/ai/gemini/vision', async (req, res) => {
  try {
    let { prompt, imageBase64, mimeType = 'image/png', model } = req.body || {};
    prompt = String(prompt || '').trim();
    imageBase64 = String(imageBase64 || '');

    if (!prompt || !imageBase64) {
      return res.status(400).json({ message: 'prompt and imageBase64 are required' });
    }

    const modelName =
      ALLOWED_MODELS.has(String(model)) ? String(model) :
      (process.env.GEMINI_MODEL || 'gemini-1.5-pro');

    const gemModel = genAI.getGenerativeModel({ model: modelName });

    const result = await gemModel.generateContent([
      { text: prompt },
      { inlineData: { data: imageBase64, mimeType } },
    ]);

    const text = result?.response?.text?.() || '';
    return res.json({ ok: true, text, model: modelName });
  } catch (e) {
    console.error('Gemini vision error:', e?.response?.data || e);
    return res.status(500).json({ message: 'Gemini vision failed' });
  }
});



app.get('/', (req, res) => {
  res.send('AgroHelp backend is running. Visit /api/health to check status.');
});

// --- Routes ---
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Insect Detection using Roboflow
app.post('/api/insects/detect', async (req, res) => {
  const { fileUrl } = req.body;

  if (!fileUrl) {
    return res.status(400).send('No image URL provided for detection.');
  }

  try {
    // Send image URL to Roboflow for insect detection
    const detectionResponse = await axios.post(
      `${process.env.ROBOFLOW_MODEL_ENDPOINT}?api_key=${process.env.ROBOFLOW_API_KEY}`,
      { image: fileUrl }
    );

    const result = detectionResponse.data;

    if (result && result.predictions.length > 0) {
      res.status(200).send({
        message: 'Insect detected!',
        predictions: result.predictions,
        fileUrl,
      });
    } else {
      res.status(200).send({
        message: 'No insect detected.',
        fileUrl,
      });
    }
  } catch (error) {
    console.error('Error during insect detection:', error);
    res.status(500).send('Error in insect detection');
  }
});

// --- Admin Routes ---
app.get('/api/admin/stats', auth, adminOnly, async (req, res) => {
  const [users, stories] = await Promise.all([
    Users.countDocuments({}),
    Stories.countDocuments({}),
  ]);
  const admins = await Users.countDocuments({ designation: 'admin' });
  res.json({ users, stories, admins });
});

app.get('/api/admin/users', auth, adminOnly, async (req, res) => {
  const users = await Users.find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();
  res.json({
    users: users.map(u => ({
      id: u._id.toString(),
      name: u.name,
      username: u.username,
      email: u.email || null,
      designation: u.designation || 'user',
      createdAt: u.createdAt,
    })),
  });
});

app.patch('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { designation } = req.body || {};
  if (!['user', 'admin'].includes(designation)) {
    return res.status(400).json({ message: 'Invalid designation' });
  }
  await Users.updateOne({ _id: new ObjectId(id) }, { $set: { designation, updatedAt: new Date() } });
  res.json({ message: 'Updated' });
});

app.delete('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  await Users.deleteOne({ _id: new ObjectId(id) });
  // Optional: also remove their stories
  await Stories.deleteMany({ ownerId: new ObjectId(id) }).catch(() => { });
  res.json({ message: 'Deleted' });
});

// --- User Routes ---
app.post('/api/auth/register', async (req, res) => {
  let { name, username, email, password, designation } = req.body || {};
  name = (name || '').trim();
  username = (username || '').trim();
  email = (email || '').trim().toLowerCase();

  if (!name || !username || !password) {
    return res.status(400).json({ message: 'Name, username and password are required' });
  }

  // Check uniqueness: username always; email only if provided
  const or = [{ username }];
  if (email) or.push({ email });
  const existing = await Users.findOne({ $or: or });
  if (existing) {
    let msg = 'Already exists'
    if (existing.username === username) msg = 'Username already taken'
    else if (email && existing.email === email) msg = 'Email already in use'
    return res.status(409).json({ message: msg });
  }

  const role = ['user', 'expert'].includes(String(designation).toLowerCase())
    ? String(designation).toLowerCase()
    : 'user';

  const passwordHash = await bcrypt.hash(password, 10);
  const doc = {
    name,
    username,
    email: email || null,
    passwordHash,
    designation: role,
    photoUrl: null,
    phone: null,
    address: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const { insertedId } = await Users.insertOne(doc);
  const user = { ...doc, _id: insertedId };

  const token = sign(user);
  res.status(201).json({
    token,
    user: {
      id: insertedId.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      designation: user.designation,
      photoUrl: user.photoUrl,
    }
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  const user = await Users.findOne({ username });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password || '', user.passwordHash);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

  const token = sign(user);
  res.json({ token, user: sanitizeUser(user) });
});


app.post('/api/auth/change-password', auth, async (req, res) => {
  try {
    const { newPassword } = req.body || {};
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ message: 'newPassword (min 6 chars) is required' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await Users.updateOne(
      { _id: new ObjectId(req.user._id) },
      { $set: { passwordHash, updatedAt: new Date() } }
    );

    // Optional: return a fresh token + sanitized user to keep client signed in
    const freshUser = await Users.findOne(
      { _id: new ObjectId(req.user._id) },
      { projection: { passwordHash: 0 } }
    );
    const token = sign(freshUser);

    return res.json({ message: 'Password updated', token, user: sanitizeUser(freshUser) });
  } catch (err) {
    console.error('change-password error:', err);
    return res.status(500).json({ message: 'Failed to change password' });
  }
});


// GET /api/auth/me -> current user
app.get('/api/auth/me', auth, async (req, res) => {
  const fresh = await Users.findOne({ _id: new ObjectId(req.user._id) });
  if (!fresh) return res.status(404).json({ message: 'User not found' });
  res.json({ user: sanitizeUser(fresh) });
});

// PATCH /api/auth/profile -> update name, username, phone, address, photoUrl
app.patch('/api/auth/profile', auth, async (req, res) => {
  const { name, username, phone, address, photoUrl, specialty, region } = req.body || {};
  const set = { updatedAt: new Date() };

  if (typeof name === 'string') set.name = name.trim();
  if (typeof username === 'string') set.username = username.trim();
  if (typeof phone === 'string' || phone === null) set.phone = phone || null;
  if (typeof address === 'string' || address === null) set.address = address || null;
  if (typeof photoUrl === 'string' || photoUrl === null) set.photoUrl = photoUrl || null;

  // NEW:
  if (typeof specialty === 'string' || specialty === null) set.specialty = specialty ? specialty.trim() : null;
  if (typeof region === 'string' || region === null) set.region = region ? region.trim() : null;

  if (set.username && set.username !== req.user.username) {
    const exists = await Users.findOne({ username: set.username });
    if (exists) return res.status(409).json({ message: 'Username already taken' });
  }

  await Users.updateOne({ _id: new ObjectId(req.user._id) }, { $set: set });
  const updated = await Users.findOne({ _id: new ObjectId(req.user._id) });
  res.json({ user: sanitizeUser(updated) });
});


// Compatibility: PATCH /api/users/me (same behavior as /api/auth/profile)
app.patch('/api/users/me', auth, async (req, res) => {
  const { name, username, phone, address, photoUrl } = req.body || {};
  const set = { updatedAt: new Date() };
  if (typeof name === 'string') set.name = name.trim();
  if (typeof username === 'string') set.username = username.trim();
  if (typeof phone === 'string' || phone === null) set.phone = phone || null;
  if (typeof address === 'string' || address === null) set.address = address || null;
  if (typeof photoUrl === 'string' || photoUrl === null) set.photoUrl = photoUrl || null;

  if (set.username && set.username !== req.user.username) {
    const exists = await Users.findOne({ username: set.username });
    if (exists) return res.status(409).json({ message: 'Username already taken' });
  }

  await Users.updateOne({ _id: new ObjectId(req.user._id) }, { $set: set });
  const updated = await Users.findOne({ _id: new ObjectId(req.user._id) });
  res.json({ user: sanitizeUser(updated) });
});

// Compatibility: PUT /api/auth/me (also updates profile)
app.put('/api/auth/me', auth, async (req, res) => {
  const { name, username, phone, address, photoUrl } = req.body || {};
  const set = { updatedAt: new Date() };
  if (typeof name === 'string') set.name = name.trim();
  if (typeof username === 'string') set.username = username.trim();
  if (typeof phone === 'string' || phone === null) set.phone = phone || null;
  if (typeof address === 'string' || address === null) set.address = address || null;
  if (typeof photoUrl === 'string' || photoUrl === null) set.photoUrl = photoUrl || null;

  if (set.username && set.username !== req.user.username) {
    const exists = await Users.findOne({ username: set.username });
    if (exists) return res.status(409).json({ message: 'Username already taken' });
  }

  await Users.updateOne({ _id: new ObjectId(req.user._id) }, { $set: set });
  const updated = await Users.findOne({ _id: new ObjectId(req.user._id) });
  res.json({ user: sanitizeUser(updated) });
});


const pickExpert = (u) => ({
  _id: u._id,
  name: u.name || null,
  username: u.username || null,
  photoUrl: u.photoUrl || null,
  specialty: u.specialty || null,   // optional field on user
  region: u.region || null,         // optional field on user
});

// ===== Experts =====

// GET /api/experts?search=rice
app.get('/api/experts', async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { designation: 'expert' };

    if (search && String(search).trim()) {
      const q = new RegExp(String(search).trim(), 'i');
      filter.$or = [
        { name: q },
        { username: q },
        { specialty: q },
        { region: q },
      ];
    }

    const experts = await Users
      .find(filter, { projection: { passwordHash: 0, email: 0, phone: 0, address: 0 } })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    res.json({ experts: experts.map(pickExpert) });
  } catch (err) {
    console.error('experts list error:', err);
    res.status(500).json({ message: 'Failed to load experts' });
  }
});

// ===== Questions (User asks Expert) =====

// POST /api/questions  { expertId, message }
app.post('/api/questions', auth, async (req, res) => {
  try {
    const { expertId, message } = req.body || {};
    if (!expertId || !message || !String(message).trim()) {
      return res.status(400).json({ message: 'expertId and message are required' });
    }

    const expert = await Users.findOne({ _id: new ObjectId(expertId), designation: 'expert' });
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    const doc = {
      expertId: expert._id,
      askerId: req.user._id,
      message: String(message).trim(),
      answer: null,
      status: 'pending',            // pending | answered
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { insertedId } = await Questions.insertOne(doc);
    res.status(201).json({
      message: 'Question sent',
      question: { _id: insertedId, ...doc, expertName: expert.name || expert.username || 'Expert' }
    });
  } catch (err) {
    console.error('create question error:', err);
    res.status(500).json({ message: 'Failed to send question' });
  }
});

// GET /api/questions/me  -> questions asked by current user
app.get('/api/questions/me', auth, async (req, res) => {
  try {
    const items = await Questions
      .find({ askerId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(300)
      .toArray();

    const expertIds = [...new Set(items.map(i => String(i.expertId)))].map(id => new ObjectId(id));
    const experts = await Users
      .find({ _id: { $in: expertIds } }, { projection: { name: 1, username: 1 } })
      .toArray();
    const map = new Map(experts.map(e => [String(e._id), e]));

    const questions = items.map(i => ({
      _id: i._id,
      expertId: i.expertId,
      expertName: map.get(String(i.expertId))?.name || map.get(String(i.expertId))?.username || 'Expert',
      message: i.message,
      answer: i.answer || null,
      status: i.status || 'pending',
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }));

    res.json({ questions });
  } catch (err) {
    console.error('my questions error:', err);
    res.status(500).json({ message: 'Failed to load questions' });
  }
});

// ===== Expert Dashboard =====

// GET /api/expert/questions -> questions assigned to this expert
app.get('/api/expert/questions', auth, expertOnly, async (req, res) => {
  try {
    const items = await Questions
      .find({ expertId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(300)
      .toArray();

    // fetch askers' display names
    const askerIds = [...new Set(items.map(i => String(i.askerId)))].map(id => new ObjectId(id));
    const askers = await Users
      .find({ _id: { $in: askerIds } }, { projection: { name: 1, username: 1, photoUrl: 1 } })
      .toArray();
    const map = new Map(askers.map(a => [String(a._id), a]));

    const questions = items.map(i => ({
      _id: i._id,
      askerId: i.askerId,
      askerName: map.get(String(i.askerId))?.name || map.get(String(i.askerId))?.username || 'User',
      askerPhotoUrl: map.get(String(i.askerId))?.photoUrl || null,
      message: i.message,
      answer: i.answer || null,
      status: i.status || 'pending',
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }));

    res.json({ questions });
  } catch (err) {
    console.error('expert questions error:', err);
    res.status(500).json({ message: 'Failed to load expert questions' });
  }
});

// PATCH /api/questions/:id/reply  { answer }
app.patch('/api/questions/:id/reply', auth, expertOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body || {};
    if (!answer || !String(answer).trim()) {
      return res.status(400).json({ message: 'answer is required' });
    }

    const q = await Questions.findOne({ _id: new ObjectId(id) });
    if (!q) return res.status(404).json({ message: 'Question not found' });
    if (String(q.expertId) !== String(req.user._id) && req.user.designation !== 'admin') {
      return res.status(403).json({ message: 'Not your question' });
    }

    await Questions.updateOne(
      { _id: q._id },
      { $set: { answer: String(answer).trim(), status: 'answered', updatedAt: new Date(), answeredAt: new Date() } }
    );

    const updated = await Questions.findOne({ _id: q._id });
    res.json({ message: 'Reply saved', question: updated });
  } catch (err) {
    console.error('reply error:', err);
    res.status(500).json({ message: 'Failed to save reply' });
  }
});



app.get('/api/advisories', async (req, res) => {
  try {
    const advisories = await AdvisoryCollection.find({}).toArray();
    res.json(advisories);
  } catch (err) {
    console.error('Error fetching advisories:', err);
    res.status(500).json({ message: 'Failed to fetch advisories' });
  }
});

// Add new advisory (Admin only)
// Add new advisory (Admin only)
app.post('/api/advisories', auth, async (req, res) => {
  if (req.user.designation !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    let { location, recommendedCrop, weather, soilHealth, resources } = req.body || {};
    location = String(location || '').trim();
    recommendedCrop = String(recommendedCrop || '').trim();
    weather = String(weather || '').trim();
    soilHealth = String(soilHealth || '').trim();
    resources = String(resources || '').trim();

    if (!location || !recommendedCrop) {
      return res.status(400).json({ message: 'Location and recommended crop are required' });
    }

    const doc = {
      location,
      recommendedCrop,
      weather,
      soilHealth,
      resources,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { insertedId } = await AdvisoryCollection.insertOne(doc);

    // ✅ Mongo v4/v5: ops নেই—নিজে তৈরি করে রিটার্ন দাও
    return res.status(201).json({
      message: 'Advisory created',
      advisory: { _id: insertedId, ...doc },
    });
  } catch (err) {
    console.error('Error adding advisory:', err);
    return res.status(500).json({ message: 'Failed to add advisory' });
  }
});

// Update an advisory (Admin only)
app.put('/api/advisories/:id', auth, async (req, res) => {
  if (req.user.designation !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const { id } = req.params;
    let { location, recommendedCrop, weather, soilHealth, resources } = req.body || {};
    const set = { updatedAt: new Date() };
    if (location !== undefined) set.location = String(location || '').trim();
    if (recommendedCrop !== undefined) set.recommendedCrop = String(recommendedCrop || '').trim();
    if (weather !== undefined) set.weather = String(weather || '').trim();
    if (soilHealth !== undefined) set.soilHealth = String(soilHealth || '').trim();
    if (resources !== undefined) set.resources = String(resources || '').trim();

    const result = await AdvisoryCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: set },
      { returnDocument: 'after' } // ✅ আপডেটেড ডক ফেরত দাও
    );

    if (!result.value) {
      return res.status(404).json({ message: 'Advisory not found' });
    }
    return res.json({ message: 'Advisory updated', advisory: result.value });
  } catch (err) {
    console.error('Error updating advisory:', err);
    return res.status(500).json({ message: 'Failed to update advisory' });
  }
});



// Delete an advisory (Admin only)
app.delete('/api/advisories/:id', auth, async (req, res) => {
  if (req.user.designation !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  try {
    const { id } = req.params;
    const result = await AdvisoryCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Advisory not found' });
    }

    res.status(200).json({ message: 'Advisory deleted' });
  } catch (err) {
    console.error('Error deleting advisory:', err);
    res.status(500).json({ message: 'Failed to delete advisory' });
  }
});



app.post('/api/markets', auth, async (req, res) => {
  if (req.user.designation !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  const { product, price, trend, trendChange } = req.body;
  if (!product || !price) {
    return res.status(400).json({ message: 'Product and price are required' });
  }

  try {
    const newMarket = {
      product,
      price,
      trend,
      trendChange,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await MarketCollection.insertOne(newMarket);
    res.status(201).json({ message: 'Market data added', market: result.ops[0] });
  } catch (err) {
    console.error('Error adding market data:', err);
    res.status(500).json({ message: 'Failed to add market data' });
  }
});

// Update Market (Admin only)
app.put('/api/markets/:id', auth, async (req, res) => {
  if (req.user.designation !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  const { id } = req.params;
  const { product, price, trend, trendChange } = req.body;
  if (!product || !price) {
    return res.status(400).json({ message: 'Product and price are required' });
  }

  try {
    const updatedMarket = {
      product,
      price,
      trend,
      trendChange,
      updatedAt: new Date(),
    };
    const result = await MarketCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedMarket }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Market data not found' });
    }
    res.status(200).json({ message: 'Market data updated' });
  } catch (err) {
    console.error('Error updating market data:', err);
    res.status(500).json({ message: 'Failed to update market data' });
  }
});

// Delete Market (Admin only)
app.delete('/api/markets/:id', auth, async (req, res) => {
  if (req.user.designation !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  const { id } = req.params;

  try {
    const result = await MarketCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Market data not found' });
    }
    res.status(200).json({ message: 'Market data deleted' });
  } catch (err) {
    console.error('Error deleting market data:', err);
    res.status(500).json({ message: 'Failed to delete market data' });
  }
});

// Get Market Data (For all users)
app.get('/api/markets', async (req, res) => {
  try {
    const markets = await MarketCollection.find({}).toArray();
    res.json(markets);
  } catch (err) {
    console.error('Error fetching market data:', err);
    res.status(500).json({ message: 'Failed to fetch market data' });
  }
});


app.get('/api/admin/stories', auth, async (req, res) => {
  try {
    const stories = await Stories.find().sort({ createdAt: -1 }).toArray();
    res.json({ stories });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load stories', error: err.message });
  }
});

app.get('/api/stories/public', async (req, res) => {
  try {
    const stories = await Stories.find().sort({ createdAt: -1 }).toArray();
    res.json({ stories });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load stories', error: err.message });
  }
});

// Add a new story (Admin only)
app.post('/api/admin/stories', auth, async (req, res) => {
  try {
    const { title, body, photoUrl, ownerPhotoUrl } = req.body || {};
    if (!title || !body) return res.status(400).json({ message: 'Title and body are required' });

    const finalPhoto = (typeof photoUrl === 'string' && photoUrl.trim())
      ? photoUrl.trim()
      : (typeof ownerPhotoUrl === 'string' && ownerPhotoUrl.trim() ? ownerPhotoUrl.trim() : null);

    if (finalPhoto) {
      await Users.updateOne(
        { _id: new ObjectId(req.user._id) },
        { $set: { photoUrl: finalPhoto, updatedAt: new Date() } }
      );
    }

    const doc = {
      title,
      body,
      ownerName: req.user?.name || 'Admin',
      ownerPhotoUrl: finalPhoto || req.user?.photoUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { insertedId } = await Stories.insertOne(doc);
    res.status(201).json({ message: 'Story created', story: { _id: insertedId, ...doc } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add story' });
  }
});


// Edit a story (Admin only)
app.patch('/api/admin/stories/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, photoUrl, ownerPhotoUrl } = req.body || {};
    if (!title || !body) return res.status(400).json({ message: 'Title and body are required' });

    const finalPhoto = (typeof photoUrl === 'string' && photoUrl.trim())
      ? photoUrl.trim()
      : (typeof ownerPhotoUrl === 'string' && ownerPhotoUrl.trim() ? ownerPhotoUrl.trim() : null);

    if (finalPhoto) {
      await Users.updateOne(
        { _id: new ObjectId(req.user._id) },
        { $set: { photoUrl: finalPhoto, updatedAt: new Date() } }
      );
    }

    const update = {
      title,
      body,
      updatedAt: new Date(),
    };
    if (finalPhoto) update.ownerPhotoUrl = finalPhoto;

    const result = await Stories.updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );

    if (!result.matchedCount) return res.status(404).json({ message: 'Story not found' });
    res.json({ message: 'Story updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update story' });
  }
});


// Delete a story (Admin only)
app.delete('/api/admin/stories/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Stories.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Story not found' });
    }

    res.status(200).json({ message: 'Story deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete story', error: err.message });
  }
});

// Get my stories
app.get('/api/stories/me', auth, async (req, res) => {
  try {
    // req.user._id is already an ObjectId from your auth middleware
    const stories = await Stories.find({ ownerId: req.user._id })
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ stories });
  } catch (err) {
    console.error('Error fetching stories:', err);
    res.status(500).json({ message: 'Failed to load stories' });
  }
});

// Add a new story (must be authenticated)
// POST /api/stories
app.post('/api/stories', auth, async (req, res) => {
  try {
    // Extract + coerce to string, then trim
    let { title = '', body = '' } = req.body || {};
    title = String(title).trim();
    body  = String(body).trim();

    // Basic validation
    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }
    if (title.length > 200) {
      return res.status(400).json({ message: 'Title is too long (max 200 chars)' });
    }
    if (body.length > 20_000) {
      return res.status(400).json({ message: 'Body is too long (max 20k chars)' });
    }

    // Build the doc. Do NOT trust client-sent owner fields.
    const now = new Date();
    const doc = {
      title,
      body,
      ownerId: req.user._id,                     // authoritative owner
      ownerName: req.user.name || req.user.username || '—',
      ownerPhotoUrl: req.user.photoUrl || null,
      createdAt: now,
      updatedAt: now,
    };

    const { insertedId } = await Stories.insertOne(doc);

    // Return the full, UI-friendly document
    return res.status(201).json({
      ok: true,
      story: { _id: insertedId, ...doc },
    });
  } catch (err) {
    console.error('Error adding story:', err);
    return res.status(500).json({ message: 'Failed to add story' });
  }
});


// PATCH /api/stories/:id
app.patch('/api/stories/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    let { title = '', body = '' } = req.body || {};
    title = String(title).trim();
    body  = String(body).trim();

    if (!title || !body) {
      return res.status(400).json({ message: 'Title and body are required' });
    }

    // Only allow update if this story belongs to the logged-in user
    const filter = {
      _id: new ObjectId(id),
      ownerId: req.user._id,
    };

    const update = {
      $set: {
        title,
        body,
        ownerId: req.user._id, // 👈 এখানেই ownerId আপডেট হবে
        updatedAt: new Date(),
      },
    };

    const result = await Stories.findOneAndUpdate(filter, update, {
      returnDocument: 'after',
    });

    if (!result.value) {
      return res
        .status(404)
        .json({ message: 'Story not found or not owned by you' });
    }

    res.json({ ok: true, story: result.value });
  } catch (err) {
    console.error('Error updating story:', err);
    res.status(500).json({ message: 'Failed to update story' });
  }
});

// GET /api/inputs?category=seed&region=Rajshahi&q=urea
app.get('/api/inputs', async (req, res) => {
  try {
    const { category, region, q } = req.query;
    const filter = {};
    if (category) filter.category = String(category).toLowerCase();
    if (region) filter.region = region;
    if (q && q.trim()) {
      filter.product = { $regex: q.trim(), $options: 'i' };
    }

    const items = await InputCollection
      .find(filter)
      .sort({ updatedAt: -1 })
      .limit(500)
      .toArray();

    res.json(items);
  } catch (err) {
    console.error('Error fetching inputs:', err);
    res.status(500).json({ message: 'Failed to fetch inputs' });
  }
});

// VALID CATEGORIES (চাইলে বাড়াতে পারো)
const VALID_CATEGORIES = ['seed', 'fertilizer', 'pesticide', 'equipment', 'irrigation', 'other'];

// CREATE input (Admin)
app.post('/api/inputs', auth, adminOnly, async (req, res) => {
  try {
    let { product, category, unit, price, region, source, notes } = req.body || {};
    product = (product || '').trim();
    category = String(category || '').toLowerCase().trim();
    unit = (unit || 'unit').trim();
    price = Number(price);

    if (!product || !category || Number.isNaN(price)) {
      return res.status(400).json({ message: 'product, category এবং price লাগবে' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: `category invalid. Use: ${VALID_CATEGORIES.join(', ')}` });
    }

    const doc = {
      product,
      category,     // seed | fertilizer | pesticide | equipment | irrigation | other
      unit,         // e.g., kg, bag, litre, piece
      price,        // numeric
      region: region || null,
      source: source || null,
      notes: notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { insertedId } = await InputCollection.insertOne(doc);
    res.status(201).json({ message: 'Input added', input: { _id: insertedId, ...doc } });
  } catch (err) {
    console.error('Create input error:', err);
    res.status(500).json({ message: 'Failed to add input' });
  }
});

// UPDATE input (Admin)
app.put('/api/inputs/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    let { product, category, unit, price, region, source, notes } = req.body || {};

    const update = { updatedAt: new Date() };
    if (product !== undefined) update.product = String(product).trim();
    if (category !== undefined) {
      category = String(category).toLowerCase().trim();
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({ message: `category invalid. Use: ${VALID_CATEGORIES.join(', ')}` });
      }
      update.category = category;
    }
    if (unit !== undefined) update.unit = String(unit).trim();
    if (price !== undefined) {
      price = Number(price);
      if (Number.isNaN(price)) return res.status(400).json({ message: 'price must be a number' });
      update.price = price;
    }
    if (region !== undefined) update.region = region || null;
    if (source !== undefined) update.source = source || null;
    if (notes !== undefined) update.notes = notes || null;

    const result = await InputCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    );
    if (!result.matchedCount) return res.status(404).json({ message: 'Input not found' });
    res.json({ message: 'Input updated' });
  } catch (err) {
    console.error('Update input error:', err);
    res.status(500).json({ message: 'Failed to update input' });
  }
});

// DELETE input (Admin)
app.delete('/api/inputs/:id', auth, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await InputCollection.deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) return res.status(404).json({ message: 'Input not found' });
    res.json({ message: 'Input deleted' });
  } catch (err) {
    console.error('Delete input error:', err);
    res.status(500).json({ message: 'Failed to delete input' });
  }
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`AgroHelp backend ready on http://localhost:${PORT}`);
  console.log(`Using MONGO_URI = ${MONGO_URI}`);
});
