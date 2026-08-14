const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Book = mongoose.models.Book || require('../models/Book');
const Borrowing = mongoose.models.Borrowing || require('../models/Borrowing');
const router = express.Router();

// Helper function to calculate fine (5 KES per day late)
const calculateFine = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    if (today <= due) return 0;
    const diffTime = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
    return diffTime * 5; // 5 KES per day
};

// Import the protect middleware
const { protect } = require('../middleware/auth');

// GET /api/library/my-books - get books issued to current student
router.get('/my-books', protect, async (req, res) => {
  try {
    console.log('Fetching books for user ID:', req.user.id);
    
    // Get student ID from the authenticated user
    const studentId = req.user.id;

    // Log the query being executed
    console.log('Searching for borrowings with:', {
      borrowerId: studentId,
      returned: false
    });

    // Find all active borrowings for this student
    const borrowings = await Borrowing.find({
      borrowerId: studentId,
      returned: false
    }).sort({ dueDate: 1 });

    console.log('Found', borrowings.length, 'active borrowings');

    // Get book details for each borrowing
    const books = await Promise.all(
      borrowings.map(async (borrowing) => {
        console.log('Processing borrowing:', borrowing._id, 'for book:', borrowing.bookId);
        const book = await Book.findById(borrowing.bookId);
        
        if (!book) {
          console.log('Book not found for borrowing:', borrowing._id);
          return null;
        }
        
        const bookData = {
          id: book._id,
          title: book.title,
          author: book.author,
          genre: book.genre,
          issueDate: borrowing.issueDate,
          dueDate: borrowing.dueDate,
          status: new Date() > new Date(borrowing.dueDate) ? 'Overdue' : 'Issued',
          fine: calculateFine(borrowing.dueDate)
        };
        
        console.log('Processed book:', bookData.title);
        return bookData;
      })
    );

    // Filter out any null values (in case books were deleted)
    const validBooks = books.filter(book => book !== null);
    
    console.log('Returning', validBooks.length, 'valid books');
    res.json(validBooks);
  } catch (err) {
    console.error('Error fetching student books:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/library - list all books with optional filters
router.get('/', protect, async (req, res) => {
  try {
    const { search, genre, author, className } = req.query;
   const query = {
  school: req.user.school
};
    
    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { genre: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Add genre filter
    if (genre) {
      query.genre = genre;
    }
    
    // Add author filter
    if (author) {
      query.author = { $regex: author, $options: 'i' };
    }
    
    // Add class filter
    if (className) {
      console.log('Filtering by className:', className);
      query.className = className;
    }
    
    console.log('Final query:', JSON.stringify(query, null, 2));
    const books = await Book.find(query);
    console.log('Found books:', books.length);
    res.json(books);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/library - add a new book
router.post('/', async (req, res) => {
  try {
    const { title, author, year, className, genre, status, copies } = req.body;
    if (!title || !author || !className) {
      return res.status(400).json({ error: 'Title, author, and class are required.' });
    }
    
    const newBook = new Book({
      title,
      author,
      year: year || new Date().getFullYear(),
      className,
      genre: genre || 'General', // Keep genre as a fallback
      status: status || 'available',
      copies: parseInt(copies) || 1,
      available: parseInt(copies) || 1
    });
    
    await newBook.save();
    res.status(201).json({ msg: 'Book added!', book: newBook });
  } catch (err) {
    console.error('Error adding book:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/library/:id - update a book
// IMPORTANT: Users can only update books belonging to their own school
router.put('/:id', protect, async (req, res) => {
  try {
    // --------------------------------------------------
    // 1. Make sure the authenticated user has a school
    // --------------------------------------------------
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
      className,
      genre,
      status,
      copies
    } = req.body;

    // --------------------------------------------------
    // 2. Validate required fields
    // --------------------------------------------------
    if (!title || !author || !className) {
      return res.status(400).json({
        success: false,
        error: 'Title, author, and class are required.'
      });
    }

    // --------------------------------------------------
    // 3. Find the book ONLY inside the user's school
    // --------------------------------------------------
    const book = await Book.findOne({
      _id: req.params.id,
      school: req.user.school
    });

    // If the book belongs to another school, it will
    // behave as if it does not exist.
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    // --------------------------------------------------
    // 4. Calculate available copies
    // --------------------------------------------------
    let available = book.available;

    if (status && status !== book.status) {
      if (status === 'available') {
        available = parseInt(copies) || book.available || 1;
      } else {
        available = 0;
      }
    }

    // --------------------------------------------------
    // 5. Update ONLY this school's book
    // --------------------------------------------------
    const updatedBook = await Book.findOneAndUpdate(
      {
        _id: req.params.id,
        school: req.user.school
      },
      {
        title: title.trim(),
        author: author.trim(),
        year: year
          ? parseInt(year)
          : book.year,
        className: className.trim(),
        genre: genre
          ? genre.trim()
          : book.genre || 'General',
        status: status || book.status,
        available
      },
      {
        new: true,
        runValidators: true
      }
    );

    // Extra safety check
    if (!updatedBook) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    console.log('[BOOK UPDATE] Successful:', {
      bookId: updatedBook._id,
      bookTitle: updatedBook.title,
      school: req.user.school,
      userId: req.user.id
    });

    // --------------------------------------------------
    // 6. Return updated book
    // --------------------------------------------------
    return res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      book: updatedBook
    });

  } catch (err) {
    console.error('[BOOK UPDATE] Error:', {
      message: err.message,
      name: err.name,
      code: err.code
    });

    // Invalid MongoDB ObjectId
    if (err.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors)
        .map(val => val.message);

      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: messages
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to update book',
      details: err.message
    });
  }
});

// POST /api/library/:id/issue - issue a book to a student
// IMPORTANT: Users can only issue books belonging to their own school
router.post('/:id/issue', protect, async (req, res) => {
  try {
    // --------------------------------------------------
    // 1. Make sure the authenticated user has a school
    // --------------------------------------------------
    if (!req.user || !req.user.school) {
      return res.status(403).json({
        success: false,
        message: 'User is not assigned to a school'
      });
    }

    const {
      borrowerId,
      borrowerName,
      className,
      dueDate,
      genre
    } = req.body;

    const bookId = req.params.id;

    // --------------------------------------------------
    // 2. Validate required fields
    // --------------------------------------------------
    if (!borrowerId || !borrowerName || !className || !dueDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // --------------------------------------------------
    // 3. Find the book ONLY inside the user's school
    // --------------------------------------------------
    const book = await Book.findOne({
      _id: bookId,
      school: req.user.school
    });

    // IMPORTANT:
    // If the book belongs to another school, it will not
    // be found and cannot be issued.
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    // --------------------------------------------------
    // 4. Ensure the book has a genre
    // --------------------------------------------------
    if (!book.genre) {
      book.genre = genre || 'General';
    }

    // --------------------------------------------------
    // 5. Check book availability
    // --------------------------------------------------
    if (book.available <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No available copies of this book'
      });
    }

    // --------------------------------------------------
    // 6. Check if this borrower already has this book
    // --------------------------------------------------
    const existingBorrowing = await Borrowing.findOne({
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

    // --------------------------------------------------
    // 7. Create borrowing record
    // --------------------------------------------------
    const borrowing = new Borrowing({
      bookId: book._id,
      bookTitle: book.title,
      borrowerId,
      borrowerName,
      className,
      genre: genre || book.genre || 'General',
      dueDate: new Date(dueDate),
      returned: false,
      fine: 0,
      issueDate: new Date()
    });

    // --------------------------------------------------
    // 8. Reduce available copies
    // --------------------------------------------------
    book.available -= 1;

    // --------------------------------------------------
    // 9. Save borrowing and book
    // --------------------------------------------------
    await borrowing.save();
    await book.save();

    console.log('[BOOK ISSUE] Successful:', {
      bookId: book._id,
      bookTitle: book.title,
      borrowerId,
      school: req.user.school,
      availableCopies: book.available
    });

    // --------------------------------------------------
    // 10. Return success response
    // --------------------------------------------------
    return res.status(200).json({
      success: true,
      message: 'Book issued successfully',
      borrowing,
      availableCopies: book.available
    });

  } catch (err) {
    console.error('[BOOK ISSUE] Error:', {
      message: err.message,
      name: err.name,
      code: err.code
    });

    // Invalid MongoDB ObjectId
    if (err.name === 'CastError') {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors)
        .map(val => val.message);

      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: messages
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to issue book',
      details: err.message
    });
  }
});
// DELETE /api/library/:id - delete a book
router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check if there are any active borrowings for this book
    const activeBorrowings = await Borrowing.find({
      bookId: req.params.id,
      returned: false
    });

    if (activeBorrowings.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete book with active borrowings',
        activeBorrowings: activeBorrowings.length
      });
    }

    // Delete the book
    await Book.findByIdAndDelete(req.params.id);
    
    // Also delete any borrowing records for this book
    await Borrowing.deleteMany({ bookId: req.params.id });
    
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).json({ 
      error: 'Failed to delete book',
      details: err.message 
    });
  }
});

// GET /api/library/issued - get all issued books grouped by class
router.get('/issued', async (req, res) => {
  try {
    const { returned, groupByClass = 'true', className } = req.query;
    const shouldGroupByClass = groupByClass === 'true';
    
    // Build query
    const query = {
  school: req.user.school
};
    if (returned === 'true') {
      query.returned = true;
    } else if (returned === 'false') {
      query.returned = false;
    }
    
    // Add class filter if provided
    if (className && className !== 'All') {
      query.className = className;
    }
    
    // First, get all active borrowings with book details
    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'books',
          localField: 'bookId',
          foreignField: '_id',
          as: 'bookDetails'
        }
      },
      { $unwind: '$bookDetails' },
      // Add a field for class name (default to 'Ungrouped' if not specified)
      {
        $addFields: {
          className: { $ifNull: ['$className', 'Ungrouped'] }
        }
      },
      // Group by book and borrower to get unique entries
      {
        $group: {
          _id: {
            bookId: '$bookId',
            borrowerId: '$borrowerId',
            returned: '$returned',
            className: '$className'  // Include class in the grouping
          },
          // Keep the most recent record for each unique book-borrower pair
          doc: { $first: '$$ROOT' },
          // Keep the most recent due date
          dueDate: { $first: '$dueDate' },
          // Keep the most recent issue date
          issueDate: { $first: '$issueDate' },
          className: { $first: '$className' },  // Keep the class name
          bookTitle: { $first: '$bookDetails.title' } // Include book title in the group
        }
      },
      // Replace the root with the document
      { $replaceRoot: { newRoot: { $mergeObjects: ['$doc', { className: '$className' }] } } },
      // Sort by class name and then by due date
      { $sort: { className: 1, dueDate: 1 } },
      {
        $project: {
          _id: 1,
          bookId: 1,
          title: '$bookTitle',
          className: 1,
          author: '$bookDetails.author',
          genre: 1,
          borrowerName: 1,
          borrowerId: 1,
          issueDate: 1,
          dueDate: 1,
          returnDate: 1,
          returned: 1,
          fine: {
            $let: {
              vars: {
                calculatedFine: {
                  $cond: [
                    { $and: [{ $eq: ['$returned', false] }, { $lte: ['$dueDate', new Date()] }] },
                    calculateFine('$dueDate'),
                    { $ifNull: ['$fine', 0] }
                  ]
                }
              },
              in: {
                $cond: [
                  { $or: [{ $eq: [{ $type: '$$calculatedFine' }, 'number'] }, { $eq: [{ $type: '$$calculatedFine' }, 'int'] }] },
                  { $max: [0, { $toDouble: '$$calculatedFine' }] },
                  0
                ]
              }
            }
          },
          daysOverdue: {
            $let: {
              vars: {
                isOverdue: {
                  $and: [
                    { $eq: ['$returned', false] },
                    { $lte: ['$dueDate', new Date()] },
                    { $ne: ['$dueDate', null] }
                  ]
                }
              },
              in: {
                $cond: [
                  '$$isOverdue',
                  {
                    $floor: {
                      $divide: [
                        { $subtract: [new Date(), '$dueDate'] },
                        1000 * 60 * 60 * 24
                      ]
                    }
                  },
                  0
                ]
              }
            }
          }
        }
      },
      { $sort: { dueDate: 1 } } // Sort by due date (earliest first)
    ];
    
    const issuedBooks = await Borrowing.aggregate(pipeline);
    
    // Update fines for overdue books
    await Promise.all(issuedBooks.map(async (book) => {
      if (!book.returned && new Date(book.dueDate) < new Date()) {
        await Borrowing.findByIdAndUpdate(book._id, { 
          fine: book.fine 
        });
      }
    }));

    res.json(issuedBooks);
  } catch (err) {
    console.error('Error fetching issued books:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch issued books' });
  }
});

// POST /api/library/return/:id - mark a book as returned
// DELETE /api/library/:id - delete a book
router.delete('/:id', async (req, res) => {
  try {
    const bookId = req.params.id;
    
    // First check if the book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Check if the book is currently borrowed
    const activeBorrowings = await Borrowing.findOne({
      bookId: book._id,
      returned: false
    });
    
    if (activeBorrowings) {
      return res.status(400).json({ 
        error: 'Cannot delete book that is currently borrowed' 
      });
    }
    
    // Delete the book
    await Book.findByIdAndDelete(bookId);
    
    // Clean up any borrowing records for this book
    await Borrowing.deleteMany({ bookId: book._id });
    
    res.json({ message: 'Book deleted successfully' });
    
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).json({ error: err.message || 'Failed to delete book' });
  }
});

router.post('/return/:id', async (req, res) => {
  try {
    const { bookId, finePaid = 0 } = req.body;
    const borrowingId = req.params.id;
    
    if (!bookId) {
      return res.status(400).json({ error: 'Book ID is required' });
    }
    
    // Find the borrowing record
    const borrowing = await Borrowing.findById(borrowingId);
    if (!borrowing) {
      return res.status(404).json({ error: 'Borrowing record not found' });
    }
    
    if (borrowing.returned) {
      return res.status(400).json({ error: 'This book has already been returned' });
    }
    
    // Find the book
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Calculate fine if the book is returned late
    const today = new Date();
    const dueDate = new Date(borrowing.dueDate);
    let fine = 0;
    let daysOverdue = 0;
    
    if (today > dueDate) {
      daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      fine = daysOverdue * 5; // 5 KES per day late
    }
    
    // Update the borrowing record
    borrowing.returned = true;
    borrowing.returnDate = today;
    borrowing.fine = fine;
    borrowing.finePaid = parseFloat(finePaid) || 0;
    
    // Update book availability
    book.available += 1;
    if (book.available > 0) {
      book.status = 'available';
    }
    
    // Save changes
    await borrowing.save();
    await book.save();
    
    res.json({ 
      message: 'Book returned successfully',
      fine,
      finePaid: borrowing.finePaid,
      daysOverdue,
      book: book,
      borrowing: borrowing
    });
    
  } catch (err) {
    console.error('Error returning book:', err);
    res.status(500).json({ error: err.message || 'Failed to return book' });
  }
});

module.exports = router;
