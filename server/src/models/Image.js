const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    default: 'image'
  },
  mimeType: {
    type: String,
    default: 'image/jpeg'
  },
  size: {
    type: Number,
    default: 0
  },
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
    default: null
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isUnused: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Image', imageSchema);
