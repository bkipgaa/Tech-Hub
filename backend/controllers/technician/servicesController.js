// Import the Technician model to interact with the technician collection
const Technician = require('../../models/Technician');

/**
 * Update pricing information (hourly rate, fixed price, consultation fee, etc.)
 * @param {Object} req - Express request object with pricing data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated pricing
 */
exports.updatePricing = async (req, res) => {
  try {
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Update pricing object by merging existing with new data
    // Spread operator (...) keeps existing fields and overrides with provided values
    technician.pricing = {
      ...technician.pricing,  // Keep existing pricing fields
      ...req.body             // Override with new values from request
    };
    
    // Update the last active timestamp to current time
    technician.lastActive = new Date();
    // Save the updated technician document to database
    await technician.save();
    
    // Return success response with updated pricing
    res.json({
      success: true,
      message: 'Pricing updated successfully',
      pricing: technician.pricing
    });
    
  } catch (error) {
    // Log error for debugging purposes
    console.error('Update pricing error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error during update',
      error: error.message 
    });
  }
};

/**
 * Add a new service category with sub-services
 * @param {Object} req - Express request object with service category data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with added service category
 */
exports.addServiceCategory = async (req, res) => {
  try {
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Construct new service category object from request body
    const newCategory = {
      categoryName: req.body.categoryName,           // Name of the service category
      subServices: req.body.subServices || [],       // Array of sub-services (default empty)
      description: req.body.description || '',       // Description of the service
      basePrice: req.body.basePrice,                 // Base price for this category
      estimatedDuration: req.body.estimatedDuration  // Estimated time to complete
    };
    
    // Add the new category to the serviceCategories array
    technician.serviceCategories.push(newCategory);
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with the newly added category
    res.status(201).json({
      success: true,
      message: 'Service category added successfully',
      // Get the last item in the array (the one we just added)
      serviceCategory: technician.serviceCategories[technician.serviceCategories.length - 1]
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Add service category error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Update an existing service category
 * @param {Object} req - Express request object with updated category data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated category
 */
exports.updateServiceCategory = async (req, res) => {
  try {
    // Extract categoryId from request parameters
    const { categoryId } = req.params;
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Find the specific service category by its ID in the array
    // The .id() method is provided by Mongoose for subdocument arrays
    const category = technician.serviceCategories.id(categoryId);
    // If category not found, return 404 error
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: 'Service category not found' 
      });
    }
    
    // Define which fields can be updated through this endpoint
    const updateableFields = ['categoryName', 'subServices', 'description', 'basePrice', 'estimatedDuration'];
    // Loop through each updateable field
    updateableFields.forEach(field => {
      // If the field is provided in the request body, update it
      if (req.body[field] !== undefined) {
        category[field] = req.body[field];
      }
    });
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated category
    res.json({
      success: true,
      message: 'Service category updated successfully',
      serviceCategory: category
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update service category error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Remove a service category
 * @param {Object} req - Express request object with categoryId
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success message
 */
exports.removeServiceCategory = async (req, res) => {
  try {
    // Extract categoryId from request parameters
    const { categoryId } = req.params;
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Find the specific service category by its ID
    const category = technician.serviceCategories.id(categoryId);
    // If category not found, return 404 error
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: 'Service category not found' 
      });
    }
    
    // Remove the category from the array
    // The .remove() method is provided by Mongoose for subdocuments
    category.remove();
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response
    res.json({
      success: true,
      message: 'Service category removed successfully'
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Remove service category error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Add a sub-service to a specific category
 * @param {Object} req - Express request object with categoryId and subService name
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated sub-services array
 */
exports.addSubService = async (req, res) => {
  try {
    // Extract categoryId from request parameters
    const { categoryId } = req.params;
    // Extract subService name from request body
    const { subService } = req.body;
    
    // Validate that subService name was provided
    if (!subService) {
      return res.status(400).json({
        success: false,
        message: 'Sub-service name is required'
      });
    }
    
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Find the specific service category by its ID
    const category = technician.serviceCategories.id(categoryId);
    // If category not found, return 404 error
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: 'Service category not found' 
      });
    }
    
    // Add the new sub-service to the category's subServices array
    category.subServices.push(subService);
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated sub-services
    res.status(201).json({
      success: true,
      message: 'Sub-service added successfully',
      subServices: category.subServices
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Add sub-service error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Remove a sub-service from a category
 * @param {Object} req - Express request object with categoryId and subIndex
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated sub-services array
 */
exports.removeSubService = async (req, res) => {
  try {
    // Extract categoryId and subIndex from request parameters
    const { categoryId, subIndex } = req.params;
    
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Find the specific service category by its ID
    const category = technician.serviceCategories.id(categoryId);
    // If category not found, return 404 error
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: 'Service category not found' 
      });
    }
    
    // Validate that the subIndex is within array bounds
    if (subIndex < 0 || subIndex >= category.subServices.length) {
      return res.status(404).json({
        success: false,
        message: 'Sub-service not found'
      });
    }
    
    // Remove the sub-service at the specified index using splice
    category.subServices.splice(subIndex, 1);
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated sub-services
    res.json({
      success: true,
      message: 'Sub-service removed successfully',
      subServices: category.subServices
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Remove sub-service error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Get all services (pricing and service categories) for the technician
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with services data
 */
exports.getServices = async (req, res) => {
  try {
    // Find technician and select only pricing and serviceCategories fields
    const technician = await Technician.findOne({ userId: req.user.userId })
      .select('pricing serviceCategories');  // Only retrieve these fields from database
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Return success response with services data
    res.json({
      success: true,
      services: {
        pricing: technician.pricing,
        serviceCategories: technician.serviceCategories
      }
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Get services error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};