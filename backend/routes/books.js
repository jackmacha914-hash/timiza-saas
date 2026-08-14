const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const Book = mongoose.models.Book || require('../models/Book');

const { protect } = require('../middleware/auth');

// Get all books with advanced filtering support
router.get('/', async (req, res) => {
    try {
        const { search, genre, author, year, status } = req.query;
        let filter = {};

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        if (genre) filter.genre = genre;
        if (author) filter.author = { $regex: author, $options: 'i' };
        if (year) filter.year = year;
        if (status) filter.status = status;

        const books = await Book.find(filter);
        res.status(200).json(books);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add a new book
router.post('/', protect, async (req, res) => {
    console.log('Received book data:', req.body);
    console.log('Authenticated user:', req.user);

    const {
        title,
        author,
        year,
        genre,
        status,
        className,
        available
    } = req.body;

    // Validate required fields
    if (!title || !author || !genre || !className) {
        console.error('Missing required fields:', {
            title,
            author,
            genre,
            className
        });

        return res.status(400).json({
            success: false,
            message: 'Title, author, genre, and class are required'
        });
    }

    // Validate authenticated user's school
    if (!req.user || !req.user.school) {
        console.error(
            'Authenticated user has no school:',
            req.user
        );

        return res.status(403).json({
            success: false,
            message: 'User is not assigned to a school'
        });
    }

    try {
        // Get available copies
        const availableCopies = parseInt(available) || 1;

        // Create book
        // IMPORTANT:
        // school comes from the authenticated user,
        // NOT from the browser request.
        const book = new Book({
            school: req.user.school,

            title: title.trim(),

            author: author.trim(),

            year: year
                ? parseInt(year)
                : new Date().getFullYear(),

            genre: genre.trim(),

            status: status || 'available',

            className: className.trim(),

            available: availableCopies
        });

        console.log('Saving book:', book);

        const savedBook = await book.save();

        console.log('Book saved successfully:', savedBook);

        return res.status(201).json({
            success: true,
            message: 'Book added successfully',
            data: savedBook
        });

    } catch (err) {
        console.error('Error saving book:', {
            message: err.message,
            name: err.name,
            code: err.code,
            keyPattern: err.keyPattern,
            keyValue: err.keyValue
        });

        return res.status(400).json({
            success: false,
            message: err.message,

            // Only expose stack trace in development
            ...(process.env.NODE_ENV === 'development' && {
                stack: err.stack
            })
        });
    }
});

module.exports = router;
