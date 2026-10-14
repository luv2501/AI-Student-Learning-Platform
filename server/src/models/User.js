import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot be longer than 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned by queries unless asked for explicitly
    },
    institution: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// Hash the password whenever it is set or changed.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Shape sent to the client — never includes the password hash.
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    institution: this.institution,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);
