const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const Book = mongoose.models.Book || require('../models/Book');
const Borrowing = mongoose.models.Borrowing || require('../models/Borrowing');

const router = express.Router();

const { protect } = require('../middleware/auth');

// ============================================================
// Helper function to calculate fine
// 5 KES per day late
// ============================================================
const calculateFine = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);

    if (today <= due) return 0;

    const diffTime = Math.ceil(
        (today - due) / (1000 * 60 * 60 * 24)
    );

    return diffTime * 5;
};

// ============================================================
// GET /api/library/my-books
// Get books issued to current student
// ============================================================
router.get('/my-books', protect, async (req, res) => {
    try {
        console.log(
            'Fetching books for user ID:',
            req.user.id
        );

        const studentId = req.user.id;

        const borrowings = await Borrowing.find({
            borrowerId: studentId,
            returned: false
        }).sort({ dueDate: 1 });

        console.log(
            'Found',
            borrowings.length,
            'active borrowings'
        );

        const books = await Promise.all(
            borrowings.map(async (borrowing) => {

                const book = await Book.findById(
                    borrowing.bookId
                );

                if (!book) {
                    return null;
                }

                const bookData = {
                    id: book._id,
                    title: book.title,
                    author: book.author,
                    genre: book.genre,
                    issueDate: borrowing.issueDate,
                    dueDate: borrowing.dueDate,
                    status:
                        new Date() >
                        new Date(borrowing.dueDate)
                            ? 'Overdue'
                            : 'Issued',
                    fine: calculateFine(
                        borrowing.dueDate
                    )
                };

                return bookData;
            })
        );

        const validBooks = books.filter(
            book => book !== null
        );

        res.json(validBooks);

    } catch (err) {
        console.error(
            'Error fetching student books:',
            err
        );

        if (
            err.name === 'JsonWebTokenError'
        ) {
            return res.status(401).json({
                error: 'Invalid token'
            });
        }

        res.status(500).json({
            error: 'Server error'
        });
    }
});

// ============================================================
// GET /api/library
// List books belonging ONLY to authenticated user's school
// ============================================================
router.get('/', protect, async (req, res) => {
    try {

        if (!req.user || !req.user.school) {
            return res.status(403).json({
                success: false,
                message:
                    'User is not assigned to a school'
            });
        }

        const {
            search,
            genre,
            author,
            className
        } = req.query;

        const query = {
            school: req.user.school
        };

        if (search) {
            query.$or = [
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
                    genre: {
                        $regex: search,
                        $options: 'i'
                    }
                }
            ];
        }

        if (genre) {
            query.genre = genre;
        }

        if (author) {
            query.author = {
                $regex: author,
                $options: 'i'
            };
        }

        if (className) {
            query.className = className;
        }

        console.log(
            '[LIBRARY] School:',
            req.user.school
        );

        console.log(
            '[LIBRARY] Query:',
            JSON.stringify(query, null, 2)
        );

        const books = await Book.find(query);

        console.log(
            `[LIBRARY] Returning ${books.length} books for school ${req.user.school}`
        );

        return res.status(200).json(books);

    } catch (err) {
        console.error(
            'Error fetching books:',
            err
        );

        res.status(500).json({
            error: err.message
        });
    }
});

// ============================================================
// POST /api/library
// Add a new book
// IMPORTANT: school comes from authenticated user
// ============================================================
router.post('/', protect, async (req, res) => {
    try {

        if (!req.user || !req.user.school) {
            return res.status(403).json({
                success: false,
                message:
                    'User is not assigned to a school'
            });
        }

        const {
            title,
            author,
            year,
            className,
            genre,
            status,
            copies
        } = req.body;

        if (!title || !author || !className) {
            return res.status(400).json({
                error:
                    'Title, author, and class are required.'
            });
        }

        const totalCopies =
            parseInt(copies) || 1;

        const newBook = new Book({
            school: req.user.school,
            title: title.trim(),
            author: author.trim(),
            year:
                year ||
                new Date().getFullYear(),
            className: className.trim(),
            genre:
                genre || 'General',
            status:
                status || 'available',
            copies: totalCopies,
            available: totalCopies
        });

        await newBook.save();

        console.log(
            '[BOOK ADD] Successful:',
            {
                bookId: newBook._id,
                school: req.user.school,
                userId: req.user.id
            }
        );

        return res.status(201).json({
            success: true,
            msg: 'Book added!',
            book: newBook
        });

    } catch (err) {
        console.error(
            'Error adding book:',
            err
        );

        res.status(500).json({
            error: err.message
        });
    }
});

// ============================================================
// GET /api/library/issued
// Get issued books for ONLY the authenticated user's school
// ============================================================
router.get('/issued', protect, async (req, res) => {
    try {

        // --------------------------------------------------------
        // SECURITY: User must belong to a school
        // --------------------------------------------------------
        if (!req.user || !req.user.school) {
            return res.status(403).json({
                success: false,
                message:
                    'User is not assigned to a school'
            });
        }

        const {
            returned,
            className
        } = req.query;

        // --------------------------------------------------------
        // Build borrowing query
        //
        // IMPORTANT:
        // The issue endpoint saves the school directly on the
        // Borrowing document, so we can safely query Borrowing
        // directly instead of relying on an aggregation lookup.
        // --------------------------------------------------------
        const query = {
            school: req.user.school
        };

        // Filter returned status when requested
        if (returned === 'true') {
            query.returned = true;
        } else if (returned === 'false') {
            query.returned = false;
        }

        // Filter by class when requested
        if (
            className &&
            className !== 'All'
        ) {
            query.className = className;
        }

        console.log(
            '[ISSUED] ========================================'
        );

        console.log(
            '[ISSUED] User ID:',
            req.user.id
        );

        console.log(
            '[ISSUED] School:',
            req.user.school
        );

        console.log(
            '[ISSUED] Query:',
            query
        );

        // --------------------------------------------------------
        // Get borrowing records
        // --------------------------------------------------------
        const borrowings =
            await Borrowing
                .find(query)
                .sort({
                    className: 1,
                    dueDate: 1
                })
                .lean();

        console.log(
            '[ISSUED] Borrowing records found:',
            borrowings.length
        );

        // --------------------------------------------------------
        // Get the related book for each borrowing
        // --------------------------------------------------------
        const issuedBooks =
            await Promise.all(
                borrowings.map(
                    async (borrowing) => {

                        console.log(
                            '[ISSUED] Processing borrowing:',
                            {
                                borrowingId:
                                    borrowing._id,

                                bookId:
                                    borrowing.bookId,

                                borrowerId:
                                    borrowing.borrowerId,

                                borrowerName:
                                    borrowing.borrowerName,

                                school:
                                    borrowing.school,

                                returned:
                                    borrowing.returned
                            }
                        );

                        // ----------------------------------------
                        // Find the actual book
                        // ----------------------------------------
                        const book =
                            await Book.findById(
                                borrowing.bookId
                            ).lean();

                        // ----------------------------------------
                        // If book was deleted, don't crash the
                        // entire issued-books request.
                        // ----------------------------------------
                        if (!book) {

                            console.warn(
                                '[ISSUED] Book not found:',
                                {
                                    borrowingId:
                                        borrowing._id,

                                    bookId:
                                        borrowing.bookId
                                }
                            );

                            return null;
                        }

                        // ----------------------------------------
                        // Calculate overdue information
                        // ----------------------------------------
                        const isOverdue =
                            !borrowing.returned &&
                            borrowing.dueDate &&
                            new Date(
                                borrowing.dueDate
                            ) < new Date();

                        const daysOverdue =
                            isOverdue
                                ? Math.ceil(
                                    (
                                        new Date() -
                                        new Date(
                                            borrowing.dueDate
                                        )
                                    ) /
                                    (
                                        1000 *
                                        60 *
                                        60 *
                                        24
                                    )
                                )
                                : 0;

                        // ----------------------------------------
                        // Calculate current fine
                        // ----------------------------------------
                        const fine =
                            isOverdue
                                ? calculateFine(
                                    borrowing.dueDate
                                )
                                : Number(
                                    borrowing.fine || 0
                                );

                        // ----------------------------------------
                        // Return the format expected by frontend
                        // ----------------------------------------
                        return {
                            _id:
                                borrowing._id,

                            bookId:
                                book._id,

                            title:
                                book.title,

                            author:
                                book.author,

                            genre:
                                borrowing.genre ||
                                book.genre ||
                                'General',

                            className:
                                borrowing.className ||
                                book.className ||
                                'Ungrouped',

                            borrowerName:
                                borrowing.borrowerName,

                            borrowerId:
                                borrowing.borrowerId,

                            borrowerEmail:
                                borrowing.borrowerEmail ||
                                '',

                            issueDate:
                                borrowing.issueDate,

                            dueDate:
                                borrowing.dueDate,

                            returnDate:
                                borrowing.returnDate ||
                                null,

                            returned:
                                borrowing.returned,

                            fine:

                                fine,

                            daysOverdue:

                                daysOverdue
                        };
                    }
                )
            );

        // --------------------------------------------------------
        // Remove borrowings whose book no longer exists
        // --------------------------------------------------------
        const validBooks =
            issuedBooks.filter(
                book => book !== null
            );

        // --------------------------------------------------------
        // Update fines for overdue books
        // --------------------------------------------------------
        await Promise.all(
            validBooks.map(
                async (book) => {

                    if (
                        !book.returned &&
                        book.dueDate &&
                        new Date(
                            book.dueDate
                        ) < new Date()
                    ) {

                        const fine =
                            calculateFine(
                                book.dueDate
                            );

                        await Borrowing.findByIdAndUpdate(
                            book._id,
                            {
                                fine
                            }
                        );
                    }
                }
            )
        );

        console.log(
            '[ISSUED] Valid issued books:',
            validBooks.length
        );

        console.log(
            '[ISSUED] ========================================'
        );

        // --------------------------------------------------------
        // Return issued books
        // --------------------------------------------------------
        return res.status(200).json(
            validBooks
        );

    } catch (err) {

        console.error(
            '[ISSUED] Error fetching issued books:',
            err
        );

        return res.status(500).json({
            success: false,
            error:
                err.message ||
                'Failed to fetch issued books'
        });
    }
});

// ============================================================
// GET /api/library/:id
// Get ONE book for editing
// IMPORTANT: Only the user's school can access it
// ============================================================
router.get('/:id', protect, async (req, res) => {
    try {

        if (!req.user || !req.user.school) {
            return res.status(403).json({
                success: false,
                message:
                    'User is not assigned to a school'
            });
        }

        const book = await Book.findOne({
            _id: req.params.id,
            school: req.user.school
        });

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: book
        });

    } catch (err) {
        console.error(
            '[BOOK GET ONE] Error:',
            err
        );

        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid book ID'
            });
        }

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// ============================================================
// PUT /api/library/:id
// Update/edit a book
// IMPORTANT: Only update books belonging to user's school
// ============================================================
router.put('/:id', protect, async (req, res) => {
    try {

        if (!req.user || !req.user.school) {
            return res.status(403).json({
                success: false,
                message:
                    'User is not assigned to a school'
            });
        }

        const {
            title,
            author,
            year,
            className,
            genre,
            status,
            copies
        } = req.body;

        if (!title || !author || !className) {
            return res.status(400).json({
                success: false,
                error:
                    'Title, author, and class are required.'
            });
        }

        const book = await Book.findOne({
            _id: req.params.id,
            school: req.user.school
        });

        if (!book) {
            return res.status(404).json({
                success: false,
                error: 'Book not found'
            });
        }

        const newCopies =
            parseInt(copies);

        // Keep the number of copies valid.
        const totalCopies =
            Number.isNaN(newCopies)
                ? (book.copies || 1)
                : newCopies;

        // Calculate currently borrowed copies.
        const borrowedCopies =
            Math.max(
                0,
                (book.copies || 0) -
                (book.available || 0)
            );

        // Never allow editing copies below
        // the number currently borrowed.
        if (totalCopies < borrowedCopies) {
            return res.status(400).json({
                success: false,
                error:
                    `Cannot reduce copies below ${borrowedCopies}. ` +
                    'Some copies are currently issued.'
            });
        }

        let available =
            totalCopies - borrowedCopies;

        // If explicitly changing status
        // to unavailable, available becomes 0.
        if (status && status !== 'available') {
            available = 0;
        }

        // If status is available,
        // preserve copies already borrowed.
        if (status === 'available') {
            available =
                totalCopies - borrowedCopies;
        }

        const updatedBook =
            await Book.findOneAndUpdate(
                {
                    _id: req.params.id,
                    school: req.user.school
                },
                {
                    title: title.trim(),
                    author: author.trim(),
                    year:
                        year
                            ? parseInt(year)
                            : book.year,
                    className:
                        className.trim(),
                    genre:
                        genre
                            ? genre.trim()
                            : book.genre || 'General',
                    status:
                        status || book.status,
                    copies: totalCopies,
                    available
                },
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!updatedBook) {
            return res.status(404).json({
                success: false,
                error: 'Book not found'
            });
        }

        console.log(
            '[BOOK UPDATE] Successful:',
            {
                bookId: updatedBook._id,
                bookTitle:
                    updatedBook.title,
                school:
                    req.user.school,
                userId:
                    req.user.id
            }
        );

        return res.status(200).json({
            success: true,
            message:
                'Book updated successfully',
            book: updatedBook
        });

    } catch (err) {
        console.error(
            '[BOOK UPDATE] Error:',
            err
        );

        if (err.name === 'CastError') {
            return res.status(404).json({
                success: false,
                error: 'Book not found'
            });
        }

        if (err.name === 'ValidationError') {
            const messages =
                Object.values(err.errors)
                    .map(val => val.message);

            return res.status(400).json({
                success: false,
                error:
                    'Validation error',
                details: messages
            });
        }

        return res.status(500).json({
            success: false,
            error:
                'Failed to update book',
            details:
                err.message
        });
    }
});

// ============================================================
// POST /api/library/:id/issue
// Issue a book to a student
// IMPORTANT: Book must belong to user's school
// ============================================================
router.post('/:id/issue', protect, async (req, res) => {
    try {

        if (!req.user || !req.user.school) {
            return res.status(403).json({
                success: false,
                message:
                    'User is not assigned to a school'
            });
        }

        const {
            borrowerId,
            borrowerName,
            borrowerEmail,
            className,
            dueDate,
            genre
        } = req.body;

        const bookId =
            req.params.id;

        const school =
            req.user.school;

        if (
            !borrowerId ||
            !borrowerName ||
            !className ||
            !dueDate
        ) {
            return res.status(400).json({
                success: false,
                error:
                    'Missing required fields'
            });
        }

        const book = await Book.findOne({
            _id: bookId,
            school: school
        });

        if (!book) {
            return res.status(404).json({
                success: false,
                error: 'Book not found'
            });
        }

        if (!book.genre) {
            book.genre =
                genre || 'General';
        }

        if (book.available <= 0) {
            return res.status(400).json({
                success: false,
                error:
                    'No available copies of this book'
            });
        }

        const existingBorrowing =
            await Borrowing.findOne({
                bookId: book._id,
                borrowerId,
                returned: false
            });

        if (existingBorrowing) {
            return res.status(400).json({
                success: false,
                error:
                    'This book is already issued to the same borrower and not yet returned'
            });
        }

        const borrowing =
            new Borrowing({
                bookId: book._id,

                bookTitle:
                    book.title,

                borrowerId:
                    borrowerId,

                borrowerName:
                    borrowerName,

                // Keep email if supplied by frontend
                ...(borrowerEmail
                    ? {
                        borrowerEmail:
                            borrowerEmail
                    }
                    : {}),

                className:
                    className,

                genre:
                    genre ||
                    book.genre ||
                    'General',

                // REQUIRED BY BORROWING SCHEMA
                school:
                    school,

                dueDate:
                    new Date(dueDate),

                returned:
                    false,

                fine:
                    0,

                issueDate:
                    new Date()
            });

        book.available -= 1;

        // Keep book status synchronized
        if (book.available <= 0) {
            book.status = 'unavailable';
        } else {
            book.status = 'available';
        }

        await borrowing.save();
        await book.save();

        console.log(
            '[BOOK ISSUE] Successful:',
            {
                borrowingId:
                    borrowing._id,

                bookId:
                    book._id,

                bookTitle:
                    book.title,

                borrowerId:
                    borrowerId,

                borrowerName:
                    borrowerName,

                borrowerEmail:
                    borrowerEmail || '',

                className:
                    className,

                school:
                    school,

                availableCopies:
                    book.available
            }
        );

        return res.status(200).json({
            success: true,

            message:
                'Book issued successfully',

            borrowing:

                borrowing,

            availableCopies:
                book.available
        });

    } catch (err) {

        console.error(
            '[BOOK ISSUE] Error:',
            {
                message:
                    err.message,

                name:
                    err.name,

                code:
                    err.code,

                errors:
                    err.errors
                        ? Object.keys(
                            err.errors
                        ).reduce(
                            (result, key) => {
                                result[key] =
                                    err.errors[key]
                                        .message;
                                return result;
                            },
                            {}
                        )
                        : undefined
            }
        );

        if (err.name === 'CastError') {
            return res.status(404).json({
                success: false,
                error:
                    'Book not found'
            });
        }

        if (err.name === 'ValidationError') {

            const messages =
                Object.values(
                    err.errors
                ).map(
                    val =>
                        val.message
                );

            return res.status(400).json({
                success: false,

                error:
                    'Validation error',

                details:
                    messages
            });
        }

        return res.status(500).json({
            success: false,

            error:
                'Failed to issue book',

            details:
                err.message
        });
    }
});


// ============================================================
// POST /api/library/return/:id
// Mark a book as returned
// ============================================================
router.post('/return/:id', protect, async (req, res) => {
    try {

        if (!req.user || !req.user.school) {
            return res.status(403).json({
                success: false,
                message:
                    'User is not assigned to a school'
            });
        }

        const {
            bookId,
            finePaid = 0
        } = req.body;

        const borrowingId =
            req.params.id;

        if (!bookId) {
            return res.status(400).json({
                error:
                    'Book ID is required'
            });
        }

        // Find borrowing AND verify
        // its book belongs to user's school.
        const book =
            await Book.findOne({
                _id: bookId,
                school:
                    req.user.school
            });

        if (!book) {
            return res.status(404).json({
                error:
                    'Book not found'
            });
        }

        const borrowing =
            await Borrowing.findOne({
                _id: borrowingId,
                bookId: book._id,
                returned: false
            });

        if (!borrowing) {
            return res.status(404).json({
                error:
                    'Borrowing record not found'
            });
        }

        const today =
            new Date();

        const dueDate =
            new Date(
                borrowing.dueDate
            );

        let fine = 0;
        let daysOverdue = 0;

        if (today > dueDate) {
            daysOverdue =
                Math.ceil(
                    (today - dueDate) /
                    (1000 *
                        60 *
                        60 *
                        24)
                );

            fine =
                daysOverdue * 5;
        }

        borrowing.returned =
            true;

        borrowing.returnDate =
            today;

        borrowing.fine =
            fine;

        borrowing.finePaid =
            parseFloat(finePaid) || 0;

        book.available += 1;

        if (book.available > 0) {
            book.status =
                'available';
        }

        await borrowing.save();
        await book.save();

        return res.json({
            message:
                'Book returned successfully',
            fine,
            finePaid:
                borrowing.finePaid,
            daysOverdue,
            book,
            borrowing
        });

    } catch (err) {
        console.error(
            'Error returning book:',
            err
        );

        return res.status(500).json({
            error:
                err.message ||
                'Failed to return book'
        });
    }
});

// ============================================================
// DELETE /api/library/:id
// Delete a book ONLY from user's school
// ============================================================
router.delete('/:id', protect, async (req, res) => {
    try {

        if (!req.user || !req.user.school) {
            return res.status(403).json({
                success: false,
                message:
                    'User is not assigned to a school'
            });
        }

        const book =
            await Book.findOne({
                _id: req.params.id,
                school:
                    req.user.school
            });

        if (!book) {
            return res.status(404).json({
                error:
                    'Book not found'
            });
        }

        const activeBorrowings =
            await Borrowing.find({
                bookId: book._id,
                returned: false
            });

        if (
            activeBorrowings.length > 0
        ) {
            return res.status(400).json({
                error:
                    'Cannot delete book with active borrowings',
                activeBorrowings:
                    activeBorrowings.length
            });
        }

        await Book.findByIdAndDelete(
            book._id
        );

        await Borrowing.deleteMany({
            bookId: book._id
        });

        return res.json({
            message:
                'Book deleted successfully'
        });

    } catch (err) {
        console.error(
            'Error deleting book:',
            err
        );

        return res.status(500).json({
            error:
                'Failed to delete book',
            details:
                err.message
        });
    }
});

module.exports = router;
