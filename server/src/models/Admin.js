import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    displayName: { 
      type: String, 
      default: 'Library Admin' 
    },
    phone: { 
      type: String, 
      default: '+91 7488252019' 
    },
    photoURL: { 
      type: String, 
      default: '' 
    },
    role: { 
      type: String, 
      default: 'admin' 
    },
    libraryName: { 
      type: String, 
      default: 'Galaxy Library' 
    },
    address: { 
      type: String, 
      default: 'DhiraBigha Sugaon Road, Tehtar, Bihar' 
    },
    bio: { 
      type: String, 
      default: 'Head Administrator of Galaxy Library & Computer Center' 
    },
  },
  { timestamps: true }
);

export default mongoose.models.Admin || mongoose.model('Admin', adminSchema);
