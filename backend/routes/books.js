const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const Book = mongoose.models.Book || require('../models/Book');

const { protect } = require('../middleware/auth');

// Get all books with advanced filtering support
// IMPORTANT: Only return books belonging to the authenticated user's school
router.get('/', protect, async (req, res) => {
    try {
        // Ensure the user is authenticated and assigned to a school
        if (!req.user || !req.user.school) {
            return res.status(403).json({
                success: false,
                message: 'User is not assigned to a school'
            });
        }

        const {
            search,
            genre,
            author,
            year,
            status
        } = req.query;

        // IMPORTANT:
        // Always restrict the query to the authenticated user's school.
        const filter = {
            school: req.user.school
        };

        // Search by title, author, or description
        if (search) {
            filter.$or = [
                {
                    title: {
                        $regex: search,
                        $options: 'i'
                    }
                },
                {
                    author: {
                        $regex: search,
                        $options: 'i'
                    }
                },
                {
                    description: {
                        $regex: search,
                        $options: 'i'
                    }
                }
            ];
        }

        // Genre filter
        if (genre) {
            filter.genre = genre;
        }

        // Author filter
        if (author) {
            filter.author = {
                $regex: author,
                $options: 'i'
            };
        }

        // Year filter
        if (year) {
            filter.year = year;
        }

        // Status filter
        if (status) {
            filter.status = status;
        }

        console.log('[BOOKS] School:', req.user.school);
        console.log(
            '[BOOKS] Query:',
            JSON.stringify(filter, null, 2)
        );

        const books = await Book.find(filter);

        console.log(
            `[BOOKS] Returning ${books.length} books for school ${req.user.school}`
        );

        return res.status(200).json(books);

    } catch (err) {
        console.error('[BOOKS] Error fetching books:', err);

        return res.status(500).json({
            success: false,
            message: err.message
        });
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

// Update/Edit a book
// IMPORTANT: A user can only update books belonging to their own school.
router.put('/:id', protect, async (req, res) => {
    try {
        // -------------------------------------------------
        // Verify authenticated user has a school
        // -------------------------------------------------
        if (!req.user || !req.user.school) {
            return res.status(403).json({
                success: false,
                message: 'User is not assigned to a school'
            });
        }

        const {
            title,
            author,
            year,
            genre,
            status,
            className,
            available
        } = req.body;

        // -------------------------------------------------
        // Validate required fields
        // -------------------------------------------------
        if (!title || !author || !genre || !className) {
            return res.status(400).json({
                success: false,
                message: 'Title, author, genre, and class are required'
            });
        }

        // -------------------------------------------------
        // IMPORTANT SCHOOL ISOLATION
        //
        // Only find the book if:
        // 1. The ID matches
        // 2. The book belongs to the logged-in user's school
        // -------------------------------------------------
        const book = await Book.findOne({
            _id: req.params.id,
            school: req.user.school
        });

        // This also prevents a user from discovering
        // whether another school's book exists.
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // -------------------------------------------------
        // Update book
        // -------------------------------------------------
        book.title = title.trim();
        book.author = author.trim();
        book.genre = genre.trim();
        book.className = className.trim();

        book.year = year
            ? parseInt(year)
            : book.year;

        if (status) {
            book.status = status;
        }

        // Only change available when explicitly provided.
        if (available !== undefined) {
            const availableCopies = parseInt(available);

            if (Number.isNaN(availableCopies) || availableCopies < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Available copies must be a valid number greater than or equal to 0'
                });
            }

            book.available = availableCopies;
        }

        const updatedBook = await book.save();

        console.log('[BOOKS] Book updated successfully:', {
            bookId: updatedBook._id,
            school: req.user.school,
            title: updatedBook.title
        });

        return res.status(200).json({
            success: true,
            message: 'Book updated successfully',
            data: updatedBook
        });

    } catch (err) {
        console.error('[BOOKS] Error updating book:', {
            message: err.message,
            name: err.name,
            code: err.code,
            keyPattern: err.keyPattern,
            keyValue: err.keyValue
        });

        return res.status(400).json({
            success: false,
            message: err.message,

            ...(process.env.NODE_ENV === 'development' && {
                stack: err.stack
            })
        });
    }
});

module.exports = router;
