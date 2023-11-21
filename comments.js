// Create web server
// Import modules
const express = require('express');
const router = express.Router();
const Comment = require('../models/comment');
const Post = require('../models/post');
const User = require('../models/user');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// @route POST api/comments
// @desc Create a comment
// @access Private
router.post(
  '/',
  auth,
  [
    body('content', 'Content is required').not().isEmpty(),
    body('postId', 'Post ID is required').not().isEmpty(),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array });
    }

    try {
      // Get user
      const user = await User.findById(req.user.id).select('-password');

      // Get post
      const post = await Post.findById(req.body.postId);

      // Create comment
      const comment = new Comment({
        content: req.body.content,
        user: req.user.id,
        post: req.body.postId,
      });

      // Add comment to post
      post.comments.unshift(comment);

      // Save post
      await post.save();

      // Save comment
      await comment.save();

      // Return comment
      res.json(comment);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route PUT api/comments/:id
// @desc Update a comment
// @access Private
router.put('/:id', auth, async (req, res) => {
  try {
    // Get comment
    const comment = await Comment.findById(req.params.id);

    // Check if comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    // Check if user owns comment
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Update comment
    comment.content = req.body.content;

    // Save comment
    await comment.save();

    // Return comment
    res.json(comment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');