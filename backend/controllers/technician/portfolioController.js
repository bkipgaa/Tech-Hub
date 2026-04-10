// Import the Technician model to interact with the technician collection
const Technician = require('../../models/Technician');

/**
 * Get all portfolio items for the technician
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with portfolio array
 */
exports.getPortfolio = async (req, res) => {
  try {
    // Find technician and select only the portfolio field
    const technician = await Technician.findOne({ userId: req.user.userId })
      .select('portfolio');  // Only retrieve portfolio array from database
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Profile not found' 
      });
    }
    
    // Return success response with portfolio items
    res.json({
      success: true,
      portfolio: technician.portfolio
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Get portfolio error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Add a new item to the portfolio
 * @param {Object} req - Express request object with portfolio item data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with added portfolio item
 */
exports.addPortfolioItem = async (req, res) => {
  try {
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Technician profile not found' 
      });
    }
    
    // Construct new portfolio item object from request body
    const portfolioItem = {
      title: req.body.title,                    // Title of the work/project
      description: req.body.description,        // Description of the work
      category: req.body.category,              // Category this work belongs to
      mediaType: req.body.mediaType,            // Type: 'image', 'video', or 'document'
      mediaUrl: req.body.mediaUrl,              // URL to the media file
      thumbnailUrl: req.body.thumbnailUrl,      // URL to thumbnail image (for videos/documents)
      clientName: req.body.clientName,          // Name of client (if applicable)
      completionDate: req.body.completionDate,  // Date work was completed
      tags: req.body.tags || [],                // Array of tags for searching
      isFeatured: req.body.isFeatured || false  // Whether to feature this item
    };
    
    // Validate required fields
    if (!portfolioItem.title || !portfolioItem.mediaType || !portfolioItem.mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title, media type, and media URL are required'
      });
    }
    
    // Add the new item to the portfolio array
    technician.portfolio.push(portfolioItem);
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with the newly added item
    res.status(201).json({
      success: true,
      message: 'Portfolio item added successfully',
      // Get the last item in the array (the one we just added)
      portfolioItem: technician.portfolio[technician.portfolio.length - 1]
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Add portfolio item error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Update an existing portfolio item
 * @param {Object} req - Express request object with itemId and updated data
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated portfolio item
 */
exports.updatePortfolioItem = async (req, res) => {
  try {
    // Extract itemId from request parameters
    const { itemId } = req.params;
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Technician profile not found' 
      });
    }
    
    // Find the specific portfolio item by its ID in the array
    // The .id() method is provided by Mongoose for subdocument arrays
    const portfolioItem = technician.portfolio.id(itemId);
    // If item not found, return 404 error
    if (!portfolioItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Portfolio item not found' 
      });
    }
    
    // Define which fields can be updated through this endpoint
    const updateableFields = ['title', 'description', 'category', 'mediaType', 
                              'mediaUrl', 'thumbnailUrl', 'clientName', 
                              'completionDate', 'tags', 'isFeatured'];
    
    // Loop through each updateable field
    updateableFields.forEach(field => {
      // If the field is provided in the request body, update it
      if (req.body[field] !== undefined) {
        portfolioItem[field] = req.body[field];
      }
    });
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated item
    res.json({
      success: true,
      message: 'Portfolio item updated successfully',
      portfolioItem
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Update portfolio item error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Remove a portfolio item
 * @param {Object} req - Express request object with itemId
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success message
 */
exports.removePortfolioItem = async (req, res) => {
  try {
    // Extract itemId from request parameters
    const { itemId } = req.params;
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Technician profile not found' 
      });
    }
    
    // Find the specific portfolio item by its ID
    const portfolioItem = technician.portfolio.id(itemId);
    // If item not found, return 404 error
    if (!portfolioItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Portfolio item not found' 
      });
    }
    
    // Remove the item from the portfolio array
    // The .remove() method is provided by Mongoose for subdocuments
    portfolioItem.remove();
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response
    res.json({
      success: true,
      message: 'Portfolio item removed successfully'
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Remove portfolio item error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Toggle the featured status of a portfolio item
 * @param {Object} req - Express request object with itemId
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated featured status
 */
exports.toggleFeatured = async (req, res) => {
  try {
    // Extract itemId from request parameters
    const { itemId } = req.params;
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Technician profile not found' 
      });
    }
    
    // Find the specific portfolio item by its ID
    const portfolioItem = technician.portfolio.id(itemId);
    // If item not found, return 404 error
    if (!portfolioItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Portfolio item not found' 
      });
    }
    
    // Toggle the isFeatured boolean (true becomes false, false becomes true)
    portfolioItem.isFeatured = !portfolioItem.isFeatured;
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with new featured status
    res.json({
      success: true,
      message: `Item ${portfolioItem.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      isFeatured: portfolioItem.isFeatured
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Toggle featured error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Add tags to a portfolio item
 * @param {Object} req - Express request object with itemId and tags array
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated tags
 */
exports.addTags = async (req, res) => {
  try {
    // Extract itemId from request parameters
    const { itemId } = req.params;
    // Extract tags array from request body
    const { tags } = req.body;
    
    // Validate that tags were provided and is an array
    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({
        success: false,
        message: 'Tags array is required'
      });
    }
    
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Technician profile not found' 
      });
    }
    
    // Find the specific portfolio item by its ID
    const portfolioItem = technician.portfolio.id(itemId);
    // If item not found, return 404 error
    if (!portfolioItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Portfolio item not found' 
      });
    }
    
    // Filter out tags that already exist in the item to avoid duplicates
    const newTags = tags.filter(tag => !portfolioItem.tags.includes(tag));
    // Add all new tags at once using spread operator
    portfolioItem.tags.push(...newTags);
    
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated tags
    res.json({
      success: true,
      message: 'Tags added successfully',
      tags: portfolioItem.tags
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Add tags error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

/**
 * Remove a tag from a portfolio item
 * @param {Object} req - Express request object with itemId and tagIndex
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with updated tags
 */
exports.removeTag = async (req, res) => {
  try {
    // Extract itemId and tagIndex from request parameters
    const { itemId, tagIndex } = req.params;
    
    // Find the technician profile for the authenticated user
    const technician = await Technician.findOne({ userId: req.user.userId });
    
    // If no profile found, return 404 error
    if (!technician) {
      return res.status(404).json({ 
        success: false,
        message: 'Technician profile not found' 
      });
    }
    
    // Find the specific portfolio item by its ID
    const portfolioItem = technician.portfolio.id(itemId);
    // If item not found, return 404 error
    if (!portfolioItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Portfolio item not found' 
      });
    }
    
    // Validate that the tagIndex is within array bounds
    if (tagIndex < 0 || tagIndex >= portfolioItem.tags.length) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }
    
    // Remove the tag at the specified index using splice
    portfolioItem.tags.splice(tagIndex, 1);
    // Update last active timestamp
    technician.lastActive = new Date();
    // Save changes to database
    await technician.save();
    
    // Return success response with updated tags
    res.json({
      success: true,
      message: 'Tag removed successfully',
      tags: portfolioItem.tags
    });
    
  } catch (error) {
    // Log error for debugging
    console.error('Remove tag error:', error);
    // Return server error response
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};