const router = require('express').Router();
const Property = require('../models/property');

// Get All Properties Route
router.get('/', async (req, res) => {
    try {
        const properties = await Property.find().sort({ createdAt: -1 });
        res.json(properties);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add New Property Route
router.post('/add', async (req, res) => {
    try {
        const { title, price, location, bedrooms, bathrooms, description, image, owner } = req.body;

        const newProperty = new Property({
            title,
            price,
            location,
            bedrooms,
            bathrooms,
            description,
            image,
            owner
        });

        const savedProperty = await newProperty.save();
        res.status(201).json({ message: 'Property posted successfully!', property: savedProperty });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;