const express = require('express');
const router = express.Router();
const LinkedinProfile = require('../models/LinkedinProfile');


router.post('/profiles', async (req, res) => {
  try {
    console.log('📥 Received profile data:', req.body);
    
    const {
      name,
      url,
      about,
      bio,
      bio_line,
      location,
      follower_count,
      connection_count
    } = req.body;

    
    if (!name || !url) {
      return res.status(400).json({
        success: false,
        message: 'Name and URL are required'
      });
    }

    
    const existingProfile = await LinkedinProfile.findOne({ where: { url } });

    if (existingProfile) {
      
      await existingProfile.update({
        name,
        about,
        bio,
        bio_line,
        location,
        follower_count,
        connection_count
      });

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: existingProfile
      });
    }

    
    const profile = await LinkedinProfile.create({
      name,
      url,
      about,
      bio,
      bio_line,
      location,
      follower_count,
      connection_count
    });

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: profile
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save profile',
      error: error.message
    });
  }
});


router.get('/profiles', async (req, res) => {
  try {
    const profiles = await LinkedinProfile.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profiles',
      error: error.message
    });
  }
});


router.get('/profiles/:id', async (req, res) => {
  try {
    const profile = await LinkedinProfile.findByPk(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

module.exports = router;
