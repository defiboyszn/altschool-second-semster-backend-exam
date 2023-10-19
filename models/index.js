const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  // token: {
  //   type: String,
  // },
});

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password; // Remove the 'password' field
  return user;
};


const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  tags: [
    {
      type: String,
    },
  ],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming a User model for the author
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  state: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  },
  read_count: {
    type: Number,
    default: 0,
  },
  reading_time: {
    type: Number,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
});

blogSchema.statics.publish = function (blogId) {
  return this.findById(blogId)
    .then(async (blog) => {
      if (!blog) {
        throw new Error("Blog not found");
      }
      if (blog.state === 'draft') {
        blog.state = 'published';
        blog.timestamp = new Date();
        await blog.save();
        return blog
      } else {
        return blog; // Blog is already published
      }
    });
};
blogSchema.statics.unpublish = function (blogId) {
  return this.findById(blogId)
    .then(async (blog) => {
      if (!blog) {
        throw new Error("Blog not found");
      }
      if (blog.state === 'published') {
        blog.state = 'draft';
        blog.timestamp = new Date();
        await blog.save();
        return blog
      } else {
        return blog;
      }
    });
};
blogSchema.statics.edit = function (blogId, data) {
  return this.findById(blogId)
    .then(async (blog) => {
      if (!blog) {
        throw new Error("Blog not found");
      };
      blog.title = data.title;
      blog.description = data.description;
      blog.tags = data.tags;
      blog.timestamp = new Date();
    });
};



const User = mongoose.model('User', userSchema);
const Blog = mongoose.model('Blog', blogSchema);


module.exports = {
  User,
  Blog
}