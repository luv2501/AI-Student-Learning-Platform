import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import apiError from '../utils/apiError.js';

/** POST /api/auth/register */
export async function register(req, res) {
  const { name, email, password, institution } = req.body;

  if (!name || !email || !password) {
    throw apiError(400, 'Name, email and password are required');
  }

  if (String(password).length < 8) {
    throw apiError(400, 'Password must be at least 8 characters');
  }

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) throw apiError(409, 'An account with that email already exists');

  const user = await User.create({ name, email, password, institution });

  res.status(201).json({ user: user.toPublic(), token: generateToken(user._id) });
}

/** POST /api/auth/login */
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) throw apiError(400, 'Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw apiError(401, 'Invalid email or password');
  }

  res.json({ user: user.toPublic(), token: generateToken(user._id) });
}

/** GET /api/auth/me */
export async function getMe(req, res) {
  res.json({ user: req.user.toPublic() });
}

/** PUT /api/auth/me */
export async function updateMe(req, res) {
  const { name, email, institution, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  if (email && email.toLowerCase() !== user.email) {
    const taken = await User.findOne({ email: email.toLowerCase() });
    if (taken) throw apiError(409, 'That email is already used by another account');
    user.email = email;
  }

  if (name !== undefined) user.name = name;
  if (institution !== undefined) user.institution = institution;

  if (newPassword) {
    if (!currentPassword) throw apiError(400, 'Enter your current password to change it');
    if (String(newPassword).length < 8) {
      throw apiError(400, 'Password must be at least 8 characters');
    }
    if (!(await user.matchPassword(currentPassword))) {
      throw apiError(401, 'Current password is incorrect');
    }
    user.password = newPassword;
  }

  await user.save();

  res.json({ user: user.toPublic() });
}
