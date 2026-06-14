const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceCatalogSchema = new Schema({
  mainCategory: {
    type: String,
    required: true,
    enum: [
      'IT & Networking',
      'Electrical Services',
      'Mechanical Services',
      'Plumbing',
      'Programming & AI',
      'Hairdressing & Beauty',
      'Carpentry & Furniture',
      'Laundry & Dry Cleaning',
      'Cleaning Services',
      'Painting & Decorating',
      'Welding & Fabrication',
      'Automotive Repair',
      'Tutoring & Training',
      'Photography & Videography',
      'Event Planning',
      'Construction & Renovation',
      'HVAC Services',
      'Appliance Repair',
      'Moving & Logistics',
      'Gardening & Landscaping'
    ]
  },
  
  serviceCategories: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    icon: String,
    image: String,
    displayOrder: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    tags: [String],
    
    subServices: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: String,
      suggestedPriceRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        currency: { type: String, default: 'KES' }
      },
      typicalDuration: {
        value: { type: Number, default: 1 },
        unit: { 
          type: String, 
          enum: ['minutes', 'hours', 'days'], 
          default: 'hours' 
        }
      },
      commonRequirements: [String],
      requiredSkills: [String],
      commonQuestions: [{
        question: String,
        type: { 
          type: String, 
          enum: ['text', 'number', 'boolean', 'multiple_choice'] 
        },
        options: [String],
        required: { type: Boolean, default: false }
      }],
      expertiseLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate'
      },
      equipmentNeeded: { type: Boolean, default: false },
      commonEquipment: [String],
      popularity: {
        searchCount: { type: Number, default: 0 },
        bookingCount: { type: Number, default: 0 }
      },
      isActive: { type: Boolean, default: true },
      displayOrder: { type: Number, default: 0 },
      
      images: [{
        url: String,
        caption: String,
        isPrimary: { type: Boolean, default: false }
      }]
    }],
    
    metadata: {
      createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
      lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
    }
  }],
  
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Indexes
ServiceCatalogSchema.index({ mainCategory: 1 });
ServiceCatalogSchema.index({ 'serviceCategories.name': 1 });
ServiceCatalogSchema.index({ 'serviceCategories.subServices.name': 1 });

module.exports = mongoose.model('ServiceCatalog', ServiceCatalogSchema);