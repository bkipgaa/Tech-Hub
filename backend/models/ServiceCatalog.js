// models/ServiceCatalog.js
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
      
      // Service-specific images
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
ServiceCatalogSchema.index({ mainCategory: 1, 'serviceCategories.name': 1 }, { unique: true });

// Ensure only one active catalog per main category
ServiceCatalogSchema.index({ mainCategory: 1, isActive: 1 }, { unique: true });

// Methods
ServiceCatalogSchema.methods.getServiceCategory = function(categoryName) {
  return this.serviceCategories.find(cat => cat.name === categoryName);
};

ServiceCatalogSchema.methods.getSubService = function(categoryName, subServiceName) {
  const category = this.serviceCategories.find(cat => cat.name === categoryName);
  return category?.subServices.find(sub => sub.name === subServiceName);
};

// Statics
ServiceCatalogSchema.statics.getCategoriesByMainCategory = async function(mainCategory) {
  const catalog = await this.findOne({ mainCategory, isActive: true });
  return catalog ? catalog.serviceCategories.filter(c => c.isActive) : [];
};

ServiceCatalogSchema.statics.getSubServicesByCategory = async function(mainCategory, serviceCategory) {
  const catalog = await this.findOne({ mainCategory, isActive: true });
  const category = catalog?.serviceCategories.find(c => c.name === serviceCategory && c.isActive);
  return category ? category.subServices.filter(s => s.isActive) : [];
};

ServiceCatalogSchema.statics.getAllActive = function() {
  return this.find({ isActive: true }).sort({ mainCategory: 1 });
};

ServiceCatalogSchema.statics.searchServices = function(query) {
  return this.aggregate([
    { $match: { isActive: true } },
    { $unwind: '$serviceCategories' },
    { $match: { 'serviceCategories.isActive': true } },
    { $unwind: '$serviceCategories.subServices' },
    { $match: { 'serviceCategories.subServices.isActive': true } },
    { 
      $match: { 
        $or: [
          { 'serviceCategories.name': { $regex: query, $options: 'i' } },
          { 'serviceCategories.subServices.name': { $regex: query, $options: 'i' } },
          { 'serviceCategories.subServices.description': { $regex: query, $options: 'i' } }
        ]
      }
    },
    {
      $project: {
        mainCategory: 1,
        serviceCategory: '$serviceCategories.name',
        serviceCategoryDescription: '$serviceCategories.description',
        serviceCategoryIcon: '$serviceCategories.icon',
        subService: '$serviceCategories.subServices.name',
        subServiceDescription: '$serviceCategories.subServices.description',
        suggestedPriceRange: '$serviceCategories.subServices.suggestedPriceRange',
        typicalDuration: '$serviceCategories.subServices.typicalDuration',
        expertiseLevel: '$serviceCategories.subServices.expertiseLevel'
      }
    },
    { $sort: { mainCategory: 1, serviceCategory: 1, subService: 1 } }
  ]);
};

ServiceCatalogSchema.statics.incrementSearchCount = async function(mainCategory, serviceCategory, subService) {
  return this.updateOne(
    { 
      mainCategory,
      'serviceCategories.name': serviceCategory,
      'serviceCategories.subServices.name': subService
    },
    { 
      $inc: { 
        'serviceCategories.$[cat].subServices.$[sub].popularity.searchCount': 1 
      } 
    },
    {
      arrayFilters: [
        { 'cat.name': serviceCategory },
        { 'sub.name': subService }
      ]
    }
  );
};

ServiceCatalogSchema.statics.incrementBookingCount = async function(mainCategory, serviceCategory, subService) {
  return this.updateOne(
    { 
      mainCategory,
      'serviceCategories.name': serviceCategory,
      'serviceCategories.subServices.name': subService
    },
    { 
      $inc: { 
        'serviceCategories.$[cat].subServices.$[sub].popularity.bookingCount': 1 
      } 
    },
    {
      arrayFilters: [
        { 'cat.name': serviceCategory },
        { 'sub.name': subService }
      ]
    }
  );
};

module.exports = mongoose.model('ServiceCatalog', ServiceCatalogSchema);